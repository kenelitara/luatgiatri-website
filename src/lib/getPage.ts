import { getPayloadClient } from '@/lib/getPayload'
import { isDraftModeEnabled } from '@/lib/draft-mode'
import type { Page, Post } from '@/payload-types'

/**
 * Fetch a Pages record.
 *
 * Normally published-only (the site's public contract). When the request is in
 * Next Draft Mode — which ONLY the auth-gated `/next/preview` route can turn on
 * — the `_status` filter is dropped and `draft: true` is passed, so an
 * unpublished draft is fetchable for the editor's preview. Without the bypass
 * cookie the published filter is untouched, so an unpublished page still 404s
 * for every visitor and every crawler.
 *
 * `isDraftModeEnabled()` is guarded (see `src/lib/draft-mode.ts`): it returns
 * false during prerender, in `generateStaticParams`, and outside a request, so
 * the M2 convention holds — a DB-less docker build bakes the notFound fallback
 * and ISR heals it at runtime.
 */
export async function getPage(slug: string): Promise<Page | null> {
  try {
    const draft = await isDraftModeEnabled()
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'pages',
      where: draft
        ? { slug: { equals: slug } }
        : { slug: { equals: slug }, _status: { equals: 'published' } },
      draft,
      depth: 2, // populates media + teamGrid members (+ their photos)
      limit: 1,
    })
    return docs[0] ?? null
  } catch {
    return null
  }
}

/**
 * Published Pages slugs — the `generateStaticParams` input for the dynamic
 * `(frontend)/[slug]` route. Same DB-at-build convention as `getPage`: a build
 * with no database (the docker builder stage) returns [] instead of throwing,
 * so `next build` never fails and nothing is prerendered by the dynamic route
 * — every page then renders on demand at runtime under the route's ISR (60 s).
 */
export async function getPublishedPageSlugs(): Promise<string[]> {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'pages',
      where: { _status: { equals: 'published' } },
      draft: false,
      depth: 0,
      limit: 1000,
    })
    return docs
      .map((doc) => doc.slug)
      .filter((slug): slug is string => typeof slug === 'string' && slug.length > 0)
  } catch {
    return []
  }
}

/**
 * Fetch a Posts record. Same DB-at-build try/catch convention as `getPage` —
 * the metadata export and the page body share this one query — and the same
 * Draft Mode branch: published-only unless the request carries the preview
 * bypass cookie. See `getPage` for why the guard is safe at build time.
 */
export async function getPost(slug: string): Promise<Post | null> {
  try {
    const draft = await isDraftModeEnabled()
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'posts',
      where: draft
        ? { slug: { equals: slug } }
        : { slug: { equals: slug }, _status: { equals: 'published' } },
      draft,
      depth: 2,
      limit: 1,
    })
    return docs[0] ?? null
  } catch {
    return null
  }
}
