/**
 * Vietnamese tax-code (mã số thuế) normalisation + validation.
 *
 * PURE — no I/O, no DB, no fetch — so the rules are unit-testable and the route
 * can reject bad input BEFORE any outbound request. An invalid code must never
 * reach dailychukyso (spec: "an invalid code must produce a clear Vietnamese
 * message and must not trigger a fetch").
 *
 * Valid shapes:
 *   - 10 digits                       (a company / household business)
 *   - 10 digits + '-' + 3 digits      (a branch / dependent unit — "đơn vị trực thuộc")
 */

export const TAX_CODE_RE = /^\d{10}(?:-\d{3})?$/

/**
 * Canonical form of a user-typed tax code.
 *  - strips whitespace and dots (the grouping separators people actually type)
 *  - maps en/em dashes and the Unicode minus to a plain hyphen, collapses runs
 *  - drops a stray leading/trailing hyphen
 *  - a bare 13-digit run becomes the branch form `10-3`
 * Anything else is returned as-is; validity is decided by `isValidTaxCode`.
 */
export function normalizeTaxCode(raw: string | undefined | null): string {
  let t = (raw ?? '')
    .trim()
    .replace(/[\s.]/g, '')
    .replace(/[–—−]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
  if (/^\d{13}$/.test(t)) t = `${t.slice(0, 10)}-${t.slice(10)}`
  return t
}

export function isValidTaxCode(code: string): boolean {
  return TAX_CODE_RE.test(code)
}
