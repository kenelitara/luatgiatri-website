/**
 * On-demand tax-code lookup with our own DB cache (client-accepted design).
 *
 * SERVER-ONLY. Runs inside the request path of `/tra-cuu-ma-so-thue/` (a
 * force-dynamic route), never at build time and never from the browser.
 *
 * Politeness contract — read before changing anything here:
 *   - one SOURCE fetch per tax code, on demand; never bulk, never a crawler,
 *     never a retry loop
 *   - a result is cached in `tax-lookups` and every later visitor for the same
 *     code is served from OUR database (no second request to the source)
 *   - at most TAX_LOOKUP_RATE_LIMIT source fetches per window per hashed IP
 *   - any non-200 / timeout / parse failure is "no data": a soft message plus a
 *     link to the source, never a stack trace and never an empty card
 *
 * The source is a third party's WordPress theme and WILL change eventually.
 * "Graceful" must not mean "silent", so the three failure shapes below are
 * logged once, on the fetch path only (a cache hit logs nothing), and the
 * visitor-facing message distinguishes OUR failure from an unknown code.
 *
 * The pure pieces (normalise, parse, TTL) live in `tax-code.ts` /
 * `tax-lookup-parse.ts` so they stay unit-testable without the DB layer.
 */
import { getPayloadClient } from '@/lib/getPayload'
import { hashIp, isRateLimited, TAX_LOOKUP_RATE_LIMIT } from '@/lib/rate-limit'
import { normalizeTaxCode } from '@/lib/tax-code'
import {
  isCacheFresh,
  missingExpectedFields,
  parseTaxRecord,
  taxSourceUrl,
  type TaxRecord,
} from '@/lib/tax-lookup-parse'

export const TAX_FETCH_TIMEOUT_MS = 5_000

/** A normal desktop UA — the source is a public marketing page and serves bots a
 *  different (or no) record. We fetch the same HTML a browser would. */
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

export type TaxLookupOutcome =
  | { status: 'found'; record: TaxRecord; fetchedAt: string; source: string; cached: boolean }
  /** the source has no record for this code (a definitive 404) */
  | { status: 'notfound'; source: string; cached: boolean }
  /** we could not obtain a usable record — our problem (network/status/theme change) */
  | { status: 'unavailable'; source: string; cached: boolean }
  | { status: 'throttled'; source: string }

type TaxFetch =
  | { kind: 'ok'; html: string }
  /** the source answered 404 — it definitively has no record for this code */
  | { kind: 'notfound' }
  /** non-200 (other), timeout or network error — OUR failure, not the code's */
  | { kind: 'unavailable' }

/** One polite HTTP GET. Never throws; failures come back as a discriminated result. */
export async function fetchTaxPage(mst: string): Promise<TaxFetch> {
  const url = taxSourceUrl(mst)
  try {
    // One line per ACTUAL source request (not per page view — a cache hit never
    // reaches here), so the "one fetch per code" guarantee is observable.
    console.info(`[mst] FETCH ${url}`)
    const res = await fetch(url, {
      headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml' },
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(TAX_FETCH_TIMEOUT_MS),
    })
    if (res.status === 404) return { kind: 'notfound' }
    if (!res.ok) {
      console.error('[mst] source fetch failed:', { mst, status: res.status })
      return { kind: 'unavailable' }
    }
    return { kind: 'ok', html: await res.text() }
  } catch (err) {
    console.error('[mst] source fetch failed:', { mst, reason: (err as Error)?.name ?? 'error' })
    return { kind: 'unavailable' }
  }
}

/** How a cached row resolved — the reason a negative is negative, kept so a
 *  cached result can be replayed without a second fetch. */
export type TaxOutcome = 'found' | 'notfound' | 'unavailable' | 'parsed-empty'

type TaxLookupRow = {
  id: number
  mst: string
  outcome?: TaxOutcome | null
  name?: string | null
  englishName?: string | null
  address?: string | null
  representative?: string | null
  fetchedAt: string
  source?: string | null
}

function rowToRecord(row: TaxLookupRow): TaxRecord {
  return {
    mst: row.mst,
    name: row.name ?? null,
    englishName: row.englishName ?? null,
    address: row.address ?? null,
    representative: row.representative ?? null,
  }
}

/** The visitor-facing outcome for a cached row (unavailable and parsed-empty
 *  are the same thing to a visitor — we have nothing to show — but the DB keeps
 *  them apart for diagnosis). */
function cachedOutcome(row: TaxLookupRow): 'found' | 'notfound' | 'unavailable' {
  if (row.outcome === 'notfound') return 'notfound'
  return 'found' === row.outcome ? 'found' : 'unavailable'
}

/**
 * Look up one tax code: cache first, then (rate-limited) fetch → parse → cache.
 * `ipHash` is the salted hash from `hashIp` — the raw IP is never seen or stored.
 */
export async function lookupTaxCode(rawMst: string, ipHash: string | null): Promise<TaxLookupOutcome> {
  const mst = normalizeTaxCode(rawMst)
  const source = taxSourceUrl(mst)
  const payload = await getPayloadClient()
  const now = new Date()

  const { docs } = await payload.find({
    collection: 'tax-lookups',
    where: { mst: { equals: mst } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const cached = docs[0] as TaxLookupRow | undefined

  if (cached && isCacheFresh(cached.fetchedAt, cached.outcome === 'found', now)) {
    const outcome = cachedOutcome(cached)
    if (outcome === 'found') {
      return { status: 'found', record: rowToRecord(cached), fetchedAt: cached.fetchedAt, source: cached.source || source, cached: true }
    }
    return { status: outcome, source: cached.source || source, cached: true }
  }

  // Rate limit gates SOURCE FETCHES only — a fresh cache hit was returned above.
  if (ipHash) {
    const windowStart = new Date(now.getTime() - TAX_LOOKUP_RATE_LIMIT.windowMinutes * 60_000).toISOString()
    const limited = await isRateLimited(
      async () =>
        (
          await payload.count({
            collection: 'tax-lookups',
            overrideAccess: true,
            where: {
              and: [
                { fetchedByIpHash: { equals: ipHash } },
                { fetchedAt: { greater_than: windowStart } },
              ],
            },
          })
        ).totalDocs,
    )
    if (limited) return { status: 'throttled', source }
  }

  const fetched = await fetchTaxPage(mst)
  const html = fetched.kind === 'ok' ? fetched.html : null
  const record = html ? parseTaxRecord(html, mst) : null

  // 200 but nothing parsed — the shape a theme change has. The most important
  // signal, because it would otherwise look identical to "unknown tax code".
  if (fetched.kind === 'ok' && !record) {
    console.error('[mst] source returned 200 but no record parsed — the page shape may have changed:', {
      mst,
      bytes: html?.length ?? 0,
    })
  }
  // A record with holes in the fields the ENTITY TYPE should have — warn (not
  // error): we still have something to show. Fields a household legitimately
  // lacks (English name, representative) are excluded, so a healthy household
  // lookup is silent (see expectedFields).
  if (record) {
    const missing = missingExpectedFields(record)
    if (missing.length) console.warn('[mst] partial record:', { mst, missing: missing.join(',') })
  }

  const fetchedAt = new Date().toISOString()
  const outcome: TaxOutcome = record
    ? 'found'
    : fetched.kind === 'notfound'
      ? 'notfound'
      : fetched.kind === 'unavailable'
        ? 'unavailable'
        : 'parsed-empty'
  // Cache every outcome so a code the source does not know is not re-fetched for
  // every visitor; `outcome` is the replayable reason.
  const data = {
    mst,
    outcome,
    name: record?.name ?? null,
    englishName: record?.englishName ?? null,
    address: record?.address ?? null,
    representative: record?.representative ?? null,
    fetchedAt,
    fetchedByIpHash: ipHash ?? null,
    source,
  }
  try {
    if (cached) {
      await payload.update({ collection: 'tax-lookups', id: cached.id, data, overrideAccess: true })
    } else {
      await payload.create({ collection: 'tax-lookups', data, overrideAccess: true })
    }
  } catch (err) {
    // A cache-write failure must never fail the visitor's lookup.
    console.error('[mst] cache write failed:', { mst, err })
  }

  if (record) return { status: 'found', record, fetchedAt, source, cached: false }
  return { status: fetched.kind === 'notfound' ? 'notfound' : 'unavailable', source, cached: false }
}

/**
 * Hash the requester's IP for the rate limit (raw IPs are never stored).
 * Same header order and same `0.0.0.0` fallback as the lead action — a request
 * with no forwarding header shares one bucket rather than escaping the limit,
 * so a direct (proxy-bypassing) connection cannot drive unlimited fetches.
 */
export async function taxLookupIpHash(
  headers: Pick<Headers, 'get'>,
  salt: string | undefined,
): Promise<string> {
  const ip = (headers.get('x-forwarded-for')?.split(',')[0] ?? headers.get('x-real-ip') ?? '0.0.0.0').trim()
  return hashIp(ip, salt ?? 'dev-salt')
}
