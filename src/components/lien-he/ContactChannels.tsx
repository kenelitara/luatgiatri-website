import type { CSSProperties, ReactNode } from 'react'

import { Heading } from '@/components/blocks/Heading'
import { MailIcon, MessengerIcon, PhoneIcon, ZaloIcon } from '@/components/icons/contact'
import { formatHotline, telHref, zaloHref } from '@/lib/contact-links'
import type { SiteSetting } from '@/payload-types'

/**
 * The `/lien-he/` channel cards — Phone · Zalo · Email · Messenger, each a big
 * icon plate over a Vietnamese label and the real value. This is the bespoke
 * page's centrepiece and replaces the ported contact `richText` block (removed
 * with the CTA banner; see AGENTS.md "Bespoke /lien-he/ layout").
 *
 * Server component: the cards are plain `<a>` tags, so the page's JS island
 * count stays where it was (HeroCarousel, LeadForm, ConsentBanner) plus the
 * click-to-load map.
 *
 * ONE SOURCE PER CHANNEL — every value comes from `SiteSettings` (passed down
 * from the route, which already reads it for metadata; no second fetch) and the
 * href rules come from `@/lib/contact-links`, the same module the floating
 * buttons use. Nothing here is hardcoded, and Messenger is OMITTED entirely
 * when `socials.facebook` is empty — never a dead link.
 */
type Channel = {
  key: 'phone' | 'zalo' | 'email' | 'messenger'
  /** visible channel name */
  label: string
  /** the channel's real value, shown under the label */
  value: string
  /** Vietnamese accessible name for the whole tile */
  aria: string
  href: string
  /** opens a new tab (Zalo / Messenger); tel: and mailto: do NOT */
  external?: boolean
  icon: ReactNode
  /** icon-plate background — brand navy / Zalo blue / brand gold */
  plateClass: string
  plateStyle?: CSSProperties
}

/** Grid width by channel count, so 3 cards don't leave a hole at lg. */
const GRID_BY_COUNT: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

export function ContactChannels({ settings }: { settings: SiteSetting }) {
  const hotline = settings.hotline
  const hotlineLabel = formatHotline(hotline)
  const email = settings.email
  const facebook = settings.socials?.facebook?.trim()

  const channels: Channel[] = [
    {
      key: 'phone',
      label: 'Điện thoại',
      value: hotlineLabel,
      aria: `Gọi điện thoại ${hotlineLabel}`,
      href: telHref(hotline),
      icon: <PhoneIcon className="h-7 w-7 sm:h-10 sm:w-10" />,
      plateClass: 'bg-brand-900', // brand navy #002147
    },
    {
      key: 'zalo',
      label: 'Zalo',
      value: hotlineLabel,
      aria: `Chat Zalo ${hotlineLabel}`,
      href: zaloHref(hotline),
      external: true,
      icon: <ZaloIcon className="h-7 w-7 sm:h-10 sm:w-10" />,
      plateClass: 'bg-[#0068FF]', // Zalo brand blue
    },
    {
      key: 'email',
      label: 'Email',
      value: email,
      aria: `Gửi email tới ${email}`,
      href: `mailto:${email}`,
      icon: <MailIcon className="h-7 w-7 sm:h-10 sm:w-10" />,
      plateClass: 'bg-gold-700', // brand gold, the WCAG-safe stop on white
    },
    // Messenger appears the moment the firm enters their Facebook URL in the
    // admin (Thông tin website) — the same hide-when-empty rule as the floating
    // buttons, from the same field.
    ...(facebook
      ? [
          {
            key: 'messenger' as const,
            label: 'Messenger',
            value: 'Nhắn tin qua Facebook',
            aria: 'Nhắn tin qua Facebook Messenger',
            href: facebook,
            external: true,
            icon: <MessengerIcon className="h-7 w-7 sm:h-10 sm:w-10" />,
            plateClass: '', // painted by plateStyle (gradient)
            plateStyle: {
              backgroundImage: 'linear-gradient(135deg, #1877F2 0%, #A033FF 100%)',
            },
          },
        ]
      : []),
  ]

  const grid = GRID_BY_COUNT[channels.length] ?? GRID_BY_COUNT[4]

  return (
    <section className="bg-brand-50 py-section">
      <div className="mx-auto max-w-6xl px-4">
        <Heading>Kênh liên hệ</Heading>
        <div className={`mt-6 grid gap-5 ${grid}`}>
          {channels.map((channel) => (
            <a
              key={channel.key}
              href={channel.href}
              aria-label={channel.aria}
              {...(channel.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="contact-focus group flex items-center gap-4 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg sm:flex-col sm:gap-5 sm:p-6 sm:text-center"
            >
              <span
                aria-hidden="true"
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm sm:h-20 sm:w-20 ${channel.plateClass}`}
                style={channel.plateStyle}
              >
                {channel.icon}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-base font-semibold text-brand-900">{channel.label}</span>
                <span className="break-words text-sm text-brand-700">{channel.value}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
