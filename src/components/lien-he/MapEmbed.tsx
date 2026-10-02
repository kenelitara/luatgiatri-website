'use client'

import { useState } from 'react'

import { MapPinIcon } from '@/components/icons/contact'

/**
 * Click-to-load Google Map for `/lien-he/`.
 *
 * WHY THIS IS A CLIENT COMPONENT AT ALL (and why it stays this tiny — the
 * site's third JS island, after HeroCarousel and LeadForm):
 *
 * An unconditional Google Maps iframe loads on page view, which sends the
 * visitor's IP to Google and lets Google set its own cookies BEFORE the visitor
 * has consented. This site gates GA4 behind the cookie banner for Nghị định
 * 13/2023/NĐ-CP compliance and publishes a privacy policy promising that data
 * is collected with consent — an always-on third-party embed would contradict
 * the firm's own policy. So the iframe is NOT in the DOM until the visitor
 * clicks: the styled placeholder below makes no request to Google (verified in
 * the network log), and the click is the consent.
 *
 * One `useState` and one `<button>`; no dependency, no effect, no fetch.
 */
const MAP_EMBED_SRC = 'https://www.google.com/maps?q=10.8009031,106.5920852&hl=vi&z=17&output=embed'

export function MapEmbed({ address }: { address: string }) {
  const [loaded, setLoaded] = useState(false)

  if (loaded) {
    return (
      <iframe
        // The coordinates are the resolved client short link
        // (https://maps.app.goo.gl/dQeNuXRD6m3fzHgV6 → "khu dân cư", Bình Tân),
        // consistent with the SiteSettings address shown beside it.
        src={MAP_EMBED_SRC}
        title={`Bản đồ vị trí: ${address}`}
        className="h-full w-full border-0"
        loading="lazy"
        // Privacy stance matches the click-to-load gate: Google gets the map
        // request, not the visitor's referring page.
        referrerPolicy="no-referrer"
        allowFullScreen
      />
    )
  }

  return (
    <div className="map-placeholder flex h-full w-full flex-col items-center justify-center gap-4 p-6 text-center">
      <MapPinIcon className="h-9 w-9 text-brand-900" />
      <button
        type="button"
        onClick={() => setLoaded(true)}
        className="contact-focus rounded bg-brand-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
      >
        Xem bản đồ
      </button>
    </div>
  )
}
