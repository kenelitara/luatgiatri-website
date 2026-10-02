/**
 * The root URL segments owned by something OTHER than the Pages collection.
 *
 * A Pages record whose slug is one of these must never be served, because the
 * dynamic `[slug]` route is a LAST RESORT: it exists for CMS-created pages
 * beyond the fixed route files, and it must never shadow (or be shadowed by)
 * a route that belongs to the framework, the admin, or another feature.
 *
 *   admin, api             -> the `(payload)` route group (admin UI + REST/GraphQL)
 *   og                     -> `src/app/og/[...slug]/route.tsx` (generated OG cards)
 *   tin-tuc                -> the news index (`(frontend)/tin-tuc/`)
 *   tim-kiem               -> the search page (`(frontend)/tim-kiem/`)
 *   tra-cuu-ma-so-thue     -> the tax-code lookup page
 *                             (`(frontend)/tra-cuu-ma-so-thue/`)
 *   next                   -> Live Preview entry/exit (`(frontend)/next/preview`,
 *                             `(frontend)/next/exit-preview`)
 *   _next                  -> Next.js internals
 *   icon.svg, robots.txt,
 *   sitemap.xml            -> Next.js file conventions at the app root
 *
 * Static segments win over a dynamic one, so these are already unreachable in
 * practice — this list is the EXPLICIT promise, enforced in both the route
 * (`notFound()`) and the Pages collection's slug validation.
 */
export const RESERVED_ROOT_SEGMENTS = [
  'admin',
  'api',
  'og',
  'tin-tuc',
  'tim-kiem',
  'tra-cuu-ma-so-thue',
  'next',
  '_next',
  'icon.svg',
  'robots.txt',
  'sitemap.xml',
] as const

/**
 * Aliases of the site root. `home` is a real Pages slug (the homepage), but the
 * homepage is served at `/` by `(frontend)/page.tsx` — serving it again at
 * `/home/` would create a duplicate URL for the same content. The dynamic
 * route refuses it; the collection validation does NOT (the homepage record
 * must stay editable).
 */
export const ROOT_ALIAS_SLUGS = ['home'] as const

/** True when the slug belongs to a non-Pages root route (route guard + editor validation). */
export function isReservedRootSegment(slug: string): boolean {
  const s = slug.trim().toLowerCase()
  return (RESERVED_ROOT_SEGMENTS as readonly string[]).includes(s)
}

/**
 * True when the dynamic `[slug]` route must NOT serve the slug: a reserved root
 * segment, or a root alias whose canonical URL is elsewhere.
 */
export function isReservedSlug(slug: string): boolean {
  const s = slug.trim().toLowerCase()
  return isReservedRootSegment(s) || (ROOT_ALIAS_SLUGS as readonly string[]).includes(s)
}
