/**
 * Vietnamese tax-code (mã số thuế) normalisation + validation.
 *
 * PURE — no I/O, no DB, no fetch — so the rules are unit-testable and the route
 * can reject bad input BEFORE any outbound request. An invalid code must never
 * reach dailychukyso (spec: "an invalid code must produce a clear Vietnamese
 * message and must not trigger a fetch").
 *
 * Real shapes (fixture-confirmed against the source for 10 and 12; 10-3 is the
 * documented branch form):
 *   - 10 digits                       a doanh nghiệp (enterprise)
 *   - 12 digits                       a hộ kinh doanh / cá nhân kinh doanh
 *                                     (business household) — e.g. 060091003294
 *   - 10 or 12 digits + '-' + 3       a chi nhánh / địa điểm kinh doanh
 *                                     (branch / dependent unit)
 *
 * The `-3` suffix is the branch convention for BOTH base lengths, so it is
 * accepted after 10 and after 12.
 */

export const TAX_CODE_RE = /^(?:\d{10}|\d{12})(?:-\d{3})?$/

/**
 * Canonical form of a user-typed tax code.
 *  - strips whitespace and dots (the grouping separators people actually type)
 *  - maps en/em dashes and the Unicode minus to a plain hyphen, collapses runs
 *  - drops a stray leading/trailing hyphen
 *  - a bare 13-digit run becomes the enterprise branch form `10-3`
 *  - a bare 15-digit run becomes the household branch form `12-3`
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
  else if (/^\d{15}$/.test(t)) t = `${t.slice(0, 12)}-${t.slice(12)}`
  return t
}

export function isValidTaxCode(code: string): boolean {
  return TAX_CODE_RE.test(code)
}
