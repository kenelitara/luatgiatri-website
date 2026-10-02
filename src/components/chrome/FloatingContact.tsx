import type { CSSProperties } from 'react'

/**
 * FloatingContact — a fixed bottom-right stack of circular quick-contact
 * buttons: Phone, Zalo, Facebook (Messenger). Rendered from
 * `src/app/(frontend)/layout.tsx`, which already calls `getSiteSettings()` and
 * passes the values down as props — this component NEVER fetches.
 *
 * SERVER component by design: three plain `<a>` tags need no JavaScript, and
 * this site deliberately keeps its client islands to a minimum (HeroCarousel,
 * LeadForm). Do not add `'use client'` here.
 *
 * ONE SOURCE PER BUTTON (client's rule, 2026-10-02):
 *  - Phone    — `tel:<hotline digits>`, from the REQUIRED `SiteSettings.hotline`.
 *  - Zalo     — `https://zalo.me/<hotline digits>`: per the client, phone and
 *               Zalo both point at the hotline. `socials.zalo` is deliberately
 *               NOT consulted here (it stays in the schema for schema.org
 *               `sameAs`); a value with two possible sources is a trap.
 *  - Facebook — `SiteSettings.socials.facebook` is the ONLY source. When it is
 *               empty the button is NOT rendered at all — no default URL, no
 *               `#`, no empty `href`. The button simply appears once the firm
 *               enters their profile URL in the admin (Thông tin website).
 *
 * The Vietnamese label is both the hover/focus pill and the `aria-label`, so
 * what a sighted user reads and what a screen reader announces are identical.
 * The component emits NO headings (heading-discipline.spec.ts counts them).
 */

/** Zalo deep-link base. The number appended to it comes from `hotline`. */
export const ZALO_BASE_URL = 'https://zalo.me'

type Variant = 'phone' | 'zalo' | 'facebook'

type FloatingContactProps = {
  /** SiteSettings.hotline — required text field. */
  hotline: string
  /** SiteSettings.socials.facebook — the ONLY source; empty ⇒ no button. */
  facebookUrl?: string | null
}

// Colours: recognisable per service and cohesive with the site. The two blue
// brands are separated on purpose — Zalo keeps its FLAT #0068FF, Messenger uses
// its blue→violet gradient, so they never read as the same blue side by side.
// White glyphs on these backgrounds: navy 16.06:1, Zalo #0068FF 4.75:1,
// Messenger gradient 4.23:1 (#1877F2) → 5.85:1 (#A033FF) — all ≥ 3:1 (WCAG
// non-text contrast; the icons are graphics, not text).
const VARIANT_CLASS: Record<Variant, string> = {
  phone: 'bg-brand-900', // brand navy #002147
  zalo: 'bg-[#0068FF]', // Zalo brand blue
  facebook: '', // painted by VARIANT_STYLE (gradient)
}

const VARIANT_STYLE: Partial<Record<Variant, CSSProperties>> = {
  facebook: { backgroundImage: 'linear-gradient(135deg, #1877F2 0%, #A033FF 100%)' },
}

/** strip separators from a dialled number — `tel:` may keep a leading `+` */
function telDigits(hotline: string): string {
  return hotline.replace(/[\s.\-()]/g, '')
}

/** digits only — what zalo.me takes in its path */
function zaloDigits(hotline: string): string {
  return hotline.replace(/\D/g, '')
}

function PhoneIcon() {
  // Lucide "phone" handset (MIT), drawn as a stroke so it takes currentColor.
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
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

function ZaloIcon() {
  // Zalo's rounded-square logo carries its wordmark; at this size the wordmark
  // alone is the cleanest recognisable equivalent.
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" focusable="false">
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

function MessengerIcon() {
  // Messenger glyph: the speech bubble with the lightning bolt knocked out via
  // fill-rule evenodd (so the button's own colour shows through the bolt). The
  // client asked for Facebook MESSAGE, not the plain "f".
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true" focusable="false">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111S18.627 0 12 0zm1.191 14.963-3.055-3.26-5.963 3.26L10.732 8.2l3.131 3.26L19.752 8.2l-6.561 6.763z"
      />
    </svg>
  )
}

function FloatingButton({
  href,
  label,
  variant,
  external,
  children,
}: {
  href: string
  label: string
  variant: Variant
  external?: boolean
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      aria-label={label}
      // External links open a new tab and drop the referrer; the `tel:` link
      // gets neither (a new tab for a phone dialer makes no sense).
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`group relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-150 hover:scale-105 ${VARIANT_CLASS[variant]}`}
      style={VARIANT_STYLE[variant]}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-md bg-brand-950 px-3 py-1.5 text-sm font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {label}
      </span>
      {children}
    </a>
  )
}

export function FloatingContact({ hotline, facebookUrl }: FloatingContactProps) {
  const phoneHref = `tel:${telDigits(hotline)}`
  const zaloHref = `${ZALO_BASE_URL}/${zaloDigits(hotline)}`
  const facebookHref = facebookUrl?.trim() || null

  return (
    <nav
      aria-label="Liên hệ nhanh"
      className="floating-contact fixed bottom-6 right-4 z-[60] flex flex-col items-end gap-3 print:hidden"
    >
      <FloatingButton href={phoneHref} label="Gọi điện" variant="phone">
        <PhoneIcon />
      </FloatingButton>
      <FloatingButton href={zaloHref} label="Chat Zalo" variant="zalo" external>
        <ZaloIcon />
      </FloatingButton>
      {facebookHref ? (
        <FloatingButton href={facebookHref} label="Nhắn tin Facebook" variant="facebook" external>
          <MessengerIcon />
        </FloatingButton>
      ) : null}
    </nav>
  )
}
