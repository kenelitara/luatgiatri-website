import { Heading } from '@/components/blocks/Heading'
import { MapEmbed } from './MapEmbed'
import { fullAddress } from '@/lib/site'
import type { SiteSetting } from '@/payload-types'

/**
 * The `/lien-he/` address + map card — the LEFT column of the contact row
 * (client request: map left, form right). The address comes from
 * `SiteSettings.address` through the shared `fullAddress()` helper (street /
 * ward / district / city, empties skipped) — the same string the footer shows,
 * so the NAP never disagrees with itself.
 *
 * The card stretches to the row height (`items-stretch` on the grid), and the
 * map area is `flex-1` with a `min-h`, so the map always matches the form's
 * height rather than collapsing to a strip. The address sits in a bar below the
 * map, so it stays visible after the map loads.
 *
 * The map itself is the click-to-load island (`MapEmbed`); see that file for
 * the Nghị định 13 rationale.
 */
const MAP_LINK = 'https://maps.app.goo.gl/dQeNuXRD6m3fzHgV6'

export function LocationCard({ settings }: { settings: SiteSetting }) {
  const address = fullAddress(settings)

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
      <div className="px-6 pt-6">
        <Heading>Địa chỉ liên hệ</Heading>
      </div>
      <div className="relative min-h-[320px] flex-1">
        <MapEmbed address={address} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-brand-100 px-6 py-4">
        <p className="text-sm text-brand-800">{address}</p>
        <a
          href={MAP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="contact-focus shrink-0 rounded text-sm font-semibold text-brand-900 underline-offset-4 hover:underline"
        >
          Chỉ đường trên Google Maps
        </a>
      </div>
    </div>
  )
}
