import type { CSSProperties } from 'react'

import { MessengerIcon, PhoneIcon, ZaloIcon } from '@/components/icons/contact'
// The icons and the phone/Zalo link rules are shared with the /lien-he/ channel
// cards — one definition per channel, so the surfaces cannot drift apart.
import { telHref, zaloHref, ZALO_BASE_URL } from '@/lib/contact-links'

export { ZALO_BASE_URL }

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
  const facebookHref = facebookUrl?.trim() || null

  return (
    <nav
      aria-label="Liên hệ nhanh"
      className="floating-contact fixed bottom-6 right-4 z-[60] flex flex-col items-end gap-3 print:hidden"
    >
      <FloatingButton href={telHref(hotline)} label="Gọi điện" variant="phone">
        <PhoneIcon />
      </FloatingButton>
      <FloatingButton href={zaloHref(hotline)} label="Chat Zalo" variant="zalo" external>
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
