/**
 * Contact-channel icons — ONE definition each, shared by BOTH the floating
 * quick-contact buttons (`chrome/FloatingContact.tsx`) and the `/lien-he/`
 * channel cards. Extracted from FloatingContact (2026-10-02) when the contact
 * page needed the same marks at a larger size; importing them here rather than
 * redrawing keeps the two surfaces from drifting apart.
 *
 * All are 24×24. Phone / Mail / MapPin are lucide-style strokes (MIT) drawn with
 * `stroke="currentColor"`, so the caller's text colour paints them. The Zalo
 * wordmark and the Messenger bubble are `fill="currentColor"` (the Messenger
 * bolt is knocked out with `fill-rule="evenodd"`, so the plate colour shows
 * through it).
 *
 * Size is the CALLER's `className`, not a built-in — the defaults match the
 * floating buttons, the contact cards pass larger utilities.
 */
type IconProps = { className?: string }

export function PhoneIcon({ className = 'h-6 w-6' }: IconProps) {
  // Lucide "phone" handset (MIT), drawn as a stroke so it takes currentColor.
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

export function ZaloIcon({ className = 'h-6 w-6' }: IconProps) {
  // Zalo's rounded-square logo carries its wordmark; at this size the wordmark
  // alone is the cleanest recognisable equivalent.
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="8.5"
        fontWeight="700"
        fill="currentColor"
      >
        Zalo
      </text>
    </svg>
  )
}

export function MessengerIcon({ className = 'h-7 w-7' }: IconProps) {
  // Messenger glyph: the speech bubble with the lightning bolt knocked out via
  // fill-rule evenodd (so the button's own colour shows through the bolt). The
  // client asked for Facebook MESSAGE, not the plain "f".
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111S18.627 0 12 0zm1.191 14.963-3.055-3.26-5.963 3.26L10.732 8.2l3.131 3.26L19.752 8.2l-6.561 6.763z"
      />
    </svg>
  )
}

export function MailIcon({ className = 'h-6 w-6' }: IconProps) {
  // Lucide "mail" (MIT) — same 24×24 / stroke-2 family as the phone handset.
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

export function MapPinIcon({ className = 'h-6 w-6' }: IconProps) {
  // Lucide "map-pin" (MIT) — the click-to-load map placeholder's mark.
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}
