import { getSiteSettings } from '@/lib/site'
import { SearchBox } from '@/components/SearchBox'

/**
 * attorneyshere.com top-bar row: phone + email on brand-navy, search box at the
 * right. The social links were removed (2026-10-02, client request) — the same
 * `SiteSettings.socials` values still drive the FloatingContact button and the
 * schema.org `sameAs` in `src/lib/jsonld.ts`, so nothing is orphaned.
 *
 * Narrow screens: the (long) email is hidden below `sm` — it stays reachable in
 * the footer and on /lien-he/. Hotline is `shrink-0`, the search form absorbs
 * the remaining width, so the row never wraps and never overflows.
 */
export async function TopBar() {
  const s = await getSiteSettings()

  return (
    <div className="bg-brand-950 text-brand-100 text-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-1">
        <div className="flex shrink-0 items-center gap-4">
          <a href={`tel:${s.hotline}`} className="whitespace-nowrap hover:text-white">
            ☎ {s.hotline}
          </a>
          <a href={`mailto:${s.email}`} className="hidden hover:text-white sm:inline">
            ✉ {s.email}
          </a>
        </div>
        <SearchBox className="min-w-0 max-w-xs flex-1" />
      </div>
    </div>
  )
}
