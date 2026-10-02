/**
 * Parser for a dailychukyso.com.vn `/mst/<code>` record page.
 *
 * PURE by design: it takes an HTML string and returns a record (or null), so it
 * is unit-testable against the saved fixture in `tests/fixtures/` — the live
 * site is NEVER hit from a test.
 *
 * The page is server-rendered WordPress; the two machine-readable sources are
 *   1. an `application/ld+json` graph whose Organization node carries
 *      legalName / alternateName / taxID / address / founder (preferred), and
 *   2. labelled spans in the body ("Tên công ty" / "Mã số thuế" / "Địa chỉ"
 *      invoice rows and the "Người đại diện" info-item) — the fallback.
 *
 * Defensive: a page that does not actually describe the requested code (e.g. the
 * site's own 404 / "Không tìm thấy MST" page) yields `null`, never a partial
 * record. A malformed JSON-LD block or a renamed label degrades to the next
 * source, then to `null` — never a throw.
 */

export type TaxRecord = {
  mst: string
  name: string | null
  /** `alternateName` in the JSON-LD graph — the English trading name */
  englishName: string | null
  address: string | null
  representative: string | null
}

export const TAX_SOURCE_NAME = 'dailychukyso.com.vn'
export const TAX_SOURCE_ORIGIN = 'https://dailychukyso.com.vn'

/** The single place the source URL is built. `mst` is already validated/normalised. */
export function taxSourceUrl(mst: string): string {
  return `${TAX_SOURCE_ORIGIN}/mst/${encodeURIComponent(mst)}`
}

/** How long a cached result stays good before the next request refreshes it once. */
export const FOUND_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days — registration data changes rarely
export const MISS_TTL_MS = 24 * 60 * 60 * 1000 // 24 h — a transient failure must not stick for 30 days

/** True while a cached row may still be served without touching the source. */
export function isCacheFresh(fetchedAt: string | null | undefined, found: boolean, now: Date): boolean {
  const t = Date.parse(fetchedAt ?? '')
  if (!Number.isFinite(t)) return false
  return now.getTime() - t < (found ? FOUND_TTL_MS : MISS_TTL_MS)
}

function str(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.replace(/\s+/g, ' ').trim()
  return s || null
}

/** Strip tags + decode the handful of entities the source emits; collapse whitespace. */
export function cleanText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function fromJsonLd(html: string, expectedMst: string): TaxRecord | null {
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    let data: unknown
    try {
      data = JSON.parse(m[1].trim())
    } catch {
      continue // malformed block — try the next one / fall through to labels
    }
    const root = data as Record<string, unknown>
    const nodes = Array.isArray(root) ? root : Array.isArray(root['@graph']) ? root['@graph'] : [root]
    for (const node of nodes as unknown[]) {
      if (!node || typeof node !== 'object') continue
      const org = node as Record<string, unknown>
      const type = org['@type']
      if (type !== 'Organization' && type !== 'LocalBusiness') continue
      const taxId = str(org.taxID) ?? str(org.identifier)
      // Must be THIS code, or we might show the site's own org node as a match.
      if (taxId !== expectedMst) continue
      const name = str(org.legalName) ?? str(org.name)
      if (!name) continue
      const address = org.address
      const street =
        address && typeof address === 'object'
          ? str((address as Record<string, unknown>).streetAddress) ?? str((address as Record<string, unknown>).name)
          : str(address)
      const founder = org.founder
      const representative =
        founder && typeof founder === 'object' ? str((founder as Record<string, unknown>).name) : str(founder)
      return { mst: taxId, name, englishName: str(org.alternateName), address: street, representative }
    }
  }
  return null
}

/**
 * The first `class="… label …"` span whose text contains `label` followed,
 * within a short window, by a `class="… value …"` span. The window tolerates the
 * address row, where the value span is wrapped in a flex `<div>` after the label.
 */
export function labelledValue(html: string, label: string, window = 400): string | null {
  const re = /<span[^>]*class="[^"]*label[^"]*"[^>]*>([\s\S]*?)<\/span>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    if (!cleanText(m[1]).toLowerCase().includes(label.toLowerCase())) continue
    const after = html.slice(m.index + m[0].length, m.index + m[0].length + window)
    const val = after.match(/<span[^>]*class="[^"]*value[^"]*"[^>]*>([\s\S]*?)<\/span>/i)
    if (val) {
      const v = cleanText(val[1])
      if (v) return v
    }
  }
  return null
}

function fromLabels(html: string, expectedMst: string): TaxRecord | null {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  const name = labelledValue(html, 'Tên công ty') ?? labelledValue(html, 'Tên doanh nghiệp') ?? (h1 ? cleanText(h1[1]) : null) ?? null
  if (!name) return null
  const mst = labelledValue(html, 'Mã số thuế')
  if (mst && mst !== expectedMst) return null // page is not about the requested code
  return {
    mst: mst ?? expectedMst,
    name,
    englishName: null, // the English name exists only in the JSON-LD graph
    address: labelledValue(html, 'Địa chỉ'),
    representative: labelledValue(html, 'Người đại diện'),
  }
}

/** Parse a record page. Returns null when the requested code is not described. */
export function parseTaxRecord(html: string, expectedMst: string): TaxRecord | null {
  if (!html) return null
  return fromJsonLd(html, expectedMst) ?? fromLabels(html, expectedMst)
}
