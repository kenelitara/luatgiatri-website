/**
 * Parser for a dailychukyso.com.vn `/mst/<code>` record page.
 *
 * PURE by design: it takes an HTML string and returns a record (or null), so it
 * is unit-testable against the saved fixtures in `tests/fixtures/` — the live
 * site is NEVER hit from a test.
 *
 * The page is server-rendered WordPress; the two machine-readable sources are
 *   1. an `application/ld+json` graph whose Organization node carries
 *      name/legalName, taxID/identifier, address, and — when the entity has one
 *      — alternateName and founder (preferred), and
 *   2. labelled spans in the record card (the `Tên công ty` / `Mã số thuế` /
 *      `Địa chỉ` invoice rows and the `Người đại diện` info-item) — the fallback.
 *
 * STRUCTURAL RULE — labelled fields are read ONLY from the record region
 * (`card-info-grid` + `invoice-section`), never from a whole-document label
 * scan. The page also carries a sitewide stats card (`MÃ SỐ THUẾ`, `Doanh
 * nghiệp`) and a marketing feature checklist that reads "✓ Người đại diện pháp
 * luật". A document-wide scan matches those first: it would store the checkmark
 * "✓" as the legal representative and show it on a law firm's website as if it
 * were a person. Anchoring the scan to the record region makes a genuinely
 * absent field `null` — and its row is simply not rendered — instead of wrong.
 *
 * Entity subtypes differ: a business household (hộ kinh doanh, 12-digit code)
 * has no `alternateName` and no `founder`; a subset schema is a LEGITIMATE
 * record, not a parse failure.
 */
export type TaxRecord = {
  mst: string
  name: string | null
  /** `alternateName` in the JSON-LD graph — the English trading name (enterprises only) */
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

/**
 * The fields an entity of this code type is EXPECTED to have — used only to
 * decide whether a record is genuinely "partial" (worth a warning) or a
 * legitimate subset schema (worth silence).
 *
 * A business household (12-digit) has no English trading name and no legal
 * representative by design, so their absence is normal; an enterprise is
 * expected to carry a representative. `name`/`address` are the two fields every
 * record has, so their absence is the real "shape changed" signal.
 * `englishName` is never required — plenty of enterprises have no registered
 * English name.
 */
export function expectedFields(mst: string): Array<'name' | 'address' | 'representative'> {
  const base = mst.replace(/-.*$/, '')
  const isHousehold = base.length === 12
  return isHousehold ? ['name', 'address'] : ['name', 'address', 'representative']
}

/** Fields present on the entity type but missing from the parsed record. */
export function missingExpectedFields(record: TaxRecord): string[] {
  return expectedFields(record.mst).filter((k) => !record[k])
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

/** The record's own containers on this theme. */
const RECORD_INFO_BLOCK = 'card-info-grid'
const RECORD_INVOICE_BLOCK = 'invoice-section'

/**
 * Inner HTML of the first `<div class="… <className> …">`, found by a balanced
 * `<div>` scan. Returns null when the class is absent OR the tags do not
 * balance — a null here means "record region not found", and the caller must
 * NOT fall back to the whole document (that is exactly the bug this prevents).
 */
export function recordBlock(html: string, className: string): string | null {
  const open = new RegExp(`<div[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>`, 'i').exec(html)
  if (!open) return null
  const start = open.index + open[0].length
  let depth = 1
  const tag = /<(\/?)div\b[^>]*>/gi
  tag.lastIndex = start
  let t: RegExpExecArray | null
  while ((t = tag.exec(html))) {
    depth += t[1] === '/' ? -1 : 1
    if (depth === 0) return html.slice(start, t.index)
  }
  return null // unbalanced markup → unknown shape
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
      // A household has neither `alternateName` nor `founder` — both come out
      // null, and their rows are not rendered. That is correct, not a failure.
      return { mst: taxId, name, englishName: str(org.alternateName), address: street, representative }
    }
  }
  return null
}

/**
 * The first `class="… label …"` span whose text contains `label` followed,
 * within a short window, by a `class="… value …"` span. MUST be called with a
 * record-region slice, never the whole document.
 */
export function labelledValue(region: string, label: string, window = 400): string | null {
  const re = /<span[^>]*class="[^"]*label[^"]*"[^>]*>([\s\S]*?)<\/span>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(region))) {
    if (!cleanText(m[1]).toLowerCase().includes(label.toLowerCase())) continue
    const after = region.slice(m.index + m[0].length, m.index + m[0].length + window)
    const val = after.match(/<span[^>]*class="[^"]*value[^"]*"[^>]*>([\s\S]*?)<\/span>/i)
    if (val) {
      const v = cleanText(val[1])
      if (v) return v
    }
  }
  return null
}

function fromLabels(html: string, expectedMst: string): TaxRecord | null {
  // Record region ONLY. If neither container is present we cannot trust a
  // whole-document read, so the page is treated as unrecognised.
  const info = recordBlock(html, RECORD_INFO_BLOCK)
  const invoice = recordBlock(html, RECORD_INVOICE_BLOCK)
  if (!info && !invoice) return null

  // The MST row is the identity anchor: without it we cannot be sure the page
  // is about the requested code, so we return null rather than guess.
  const mst = invoice ? labelledValue(invoice, 'Mã số thuế') : null
  if (!mst || mst !== expectedMst) return null

  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  const name =
    (invoice ? labelledValue(invoice, 'Tên công ty') : null) ?? (h1 ? cleanText(h1[1]) : null)
  if (!name) return null

  return {
    mst,
    name,
    englishName: null, // the English name exists only in the JSON-LD graph (enterprises)
    address:
      (info ? labelledValue(info, 'Địa chỉ') : null) ??
      (invoice ? labelledValue(invoice, 'Địa chỉ') : null),
    representative: info ? labelledValue(info, 'Người đại diện') : null,
  }
}

/** Parse a record page. Returns null when the requested code is not described. */
export function parseTaxRecord(html: string, expectedMst: string): TaxRecord | null {
  if (!html) return null
  return fromJsonLd(html, expectedMst) ?? fromLabels(html, expectedMst)
}
