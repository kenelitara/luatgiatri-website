/**
 * Contact link + display helpers — ONE source per channel, shared by the
 * floating quick-contact buttons (`chrome/FloatingContact.tsx`), the `/lien-he/`
 * channel cards and the location section. The rules live here rather than in a
 * component so the phone/Zalo/mailto targets cannot diverge between surfaces.
 *
 * Client's rules (2026-10-02), unchanged from the floating buttons:
 *  - Phone — `tel:<hotline digits>`, from the required `SiteSettings.hotline`.
 *  - Zalo  — `https://zalo.me/<hotline digits>`: phone and Zalo both point at
 *            the hotline. `socials.zalo` is deliberately NOT consulted — it
 *            stays in the schema for schema.org `sameAs`; a value with two
 *            possible sources is a trap.
 *  - Email — the email address verbatim (the caller builds `mailto:`).
 *  - Messenger — `SiteSettings.socials.facebook`; when empty the caller omits
 *            the whole card rather than rendering a dead link.
 */

/** Zalo deep-link base. The number appended to it comes from `hotline`. */
export const ZALO_BASE_URL = 'https://zalo.me'

/** strip separators from a dialled number — `tel:` may keep a leading `+` */
export function telDigits(hotline: string): string {
  return hotline.replace(/[\s.\-()]/g, '')
}

/** digits only — what zalo.me takes in its path */
export function zaloDigits(hotline: string): string {
  return hotline.replace(/\D/g, '')
}

/** `tel:` href for the hotline (keeps a leading `+`, drops separators). */
export function telHref(hotline: string): string {
  return `tel:${telDigits(hotline)}`
}

/** Zalo deep link for the hotline. */
export function zaloHref(hotline: string): string {
  return `${ZALO_BASE_URL}/${zaloDigits(hotline)}`
}

/**
 * Display form of the hotline: a 10-digit Vietnamese number is grouped
 * 4-3-3 (`0919088119` → `0919 088 119`). Anything else is returned untouched —
 * the display is cosmetic and must never lose a digit or invent a grouping.
 */
export function formatHotline(hotline: string): string {
  const digits = zaloDigits(hotline)
  return digits.length === 10
    ? `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
    : hotline
}
