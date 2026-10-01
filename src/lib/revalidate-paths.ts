import { isReservedRootSegment } from './reserved-slugs'

/**
 * The exact URL paths a CMS write must purge (Next `revalidatePath`), per
 * collection. PURE on purpose — no Payload, no `next/cache`, no DB — so the
 * mapping from a document to the routes it affects is unit-testable, the same
 * split as `search-text.ts` (AGENTS.md, Task 8b/18).
 *
 * Every path is the CANONICAL form the app serves under `trailingSlash: true`
 * (`/tin-tuc/`, never `/tin-tuc`). `revalidatePath` normalises slashes itself,
 * but passing the canonical form keeps the mapping readable and matches what
 * `sitemap.ts` advertises.
 */

/** `/sitemap.xml` is `force-dynamic` today, so purging it is a no-op — kept so
 *  the mapping stays correct if it ever returns to ISR (AGENTS.md, M3 gate). */
export const SITEMAP_PATH = '/sitemap.xml'

/** The news index — affected by any post or category change. */
export const NEWS_INDEX_PATH = '/tin-tuc/'

/**
 * A Pages record's public URL. `home` is a ROOT ALIAS: the homepage record
 * carries the slug `home` but is served at `/` by `(frontend)/page.tsx`
 * (AGENTS.md, Front-end routing model), so it must never be purged as `/home/`.
 * A reserved root segment is not servable at all (the collection validation
 * refuses to create one) — returning null keeps a stray segment from purging
 * the admin/API/OG tree.
 */
export function pageUrl(slug: string | null | undefined): string | null {
  const s = slug?.trim()
  if (!s) return null
  if (s === 'home') return '/'
  if (isReservedRootSegment(s)) return null
  return `/${s}/`
}

/** `/og/page/<slug>/` — the generated OG card (Task 13). */
export function ogPageUrl(slug: string | null | undefined): string | null {
  const s = slug?.trim()
  return s ? `/og/page/${s}/` : null
}

/** `/tin-tuc/<slug>/` — a published post. */
export function postUrl(slug: string | null | undefined): string | null {
  const s = slug?.trim()
  return s ? `/tin-tuc/${s}/` : null
}

/** `/og/post/<slug>/` — the generated OG card (Task 13). */
export function ogPostUrl(slug: string | null | undefined): string | null {
  const s = slug?.trim()
  return s ? `/og/post/${s}/` : null
}

/** `/tin-tuc/chuyen-muc/<slug>/` — a category archive. */
export function categoryUrl(slug: string | null | undefined): string | null {
  const s = slug?.trim()
  return s ? `/tin-tuc/chuyen-muc/${s}/` : null
}

/** Slug strings from a relationship field whose values are ids OR populated docs. */
export function relationshipSlugs(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) =>
      typeof entry === 'object' && entry !== null ? (entry as { slug?: unknown }).slug : undefined,
    )
    .filter((slug): slug is string => typeof slug === 'string' && slug.length > 0)
}

/** Relationship entries' ids, whatever shape the field came back in. */
export function relationshipIds(value: unknown): Array<string | number> {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) =>
      typeof entry === 'object' && entry !== null ? (entry as { id?: unknown }).id : entry,
    )
    .filter((id): id is string | number => typeof id === 'string' || typeof id === 'number')
}

/** De-duplicate, drop the falsy entries, and keep the order stable. */
export function uniquePaths(paths: Array<string | null | undefined>): string[] {
  const out: string[] = []
  for (const p of paths) {
    if (p && !out.includes(p)) out.push(p)
  }
  return out
}

/**
 * A Page write purges the page itself, its OG card, and the sitemap. A slug
 * CHANGE (rare — editors are told not to) must purge BOTH URLs: the old one is
 * now a 404 and the new one did not exist a moment ago.
 */
export function pageChangePaths(
  slug: string | null | undefined,
  previousSlug?: string | null,
): string[] {
  return uniquePaths([
    pageUrl(slug),
    ogPageUrl(slug),
    previousSlug !== slug ? pageUrl(previousSlug) : null,
    previousSlug !== slug ? ogPageUrl(previousSlug) : null,
    SITEMAP_PATH,
  ])
}

/**
 * A Post write purges the post, its OG card, the news index, the sitemap, and
 * EVERY category archive it belongs to — both the categories it now has and the
 * ones it just left (a re-filed post must disappear from the old archive just as
 * immediately as it appears in the new one).
 */
export function postChangePaths(input: {
  slug: string | null | undefined
  previousSlug?: string | null
  categorySlugs?: string[]
  previousCategorySlugs?: string[]
}): string[] {
  const { slug, previousSlug, categorySlugs = [], previousCategorySlugs = [] } = input
  const slugChanged = previousSlug !== slug
  return uniquePaths([
    postUrl(slug),
    ogPostUrl(slug),
    slugChanged ? postUrl(previousSlug) : null,
    slugChanged ? ogPostUrl(previousSlug) : null,
    NEWS_INDEX_PATH,
    ...categorySlugs.map(categoryUrl),
    ...previousCategorySlugs.map(categoryUrl),
    SITEMAP_PATH,
  ])
}

/**
 * A Category write purges its archive, the news index (post counts / listings),
 * and the sitemap. A slug change purges the old archive URL too.
 */
export function categoryChangePaths(
  slug: string | null | undefined,
  previousSlug?: string | null,
): string[] {
  return uniquePaths([
    categoryUrl(slug),
    previousSlug !== slug ? categoryUrl(previousSlug) : null,
    NEWS_INDEX_PATH,
    SITEMAP_PATH,
  ])
}
