import { getPayloadClient } from '@/lib/getPayload'
import type { Page, Post } from '@/payload-types'

/**
 * Fetch a published Pages record. The try/catch implements the M2 convention
 * (AGENTS.md): docker builds have no DB — the build bakes the notFound
 * fallback and the first runtime request past the revalidate window
 * regenerates with the real page (ISR self-heal).
 */
export async function getPage(slug: string): Promise<Page | null> {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'pages',
      where: { slug: { equals: slug }, _status: { equals: 'published' } },
      draft: false,
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
 * Fetch a published Posts record. Same DB-at-build try/catch convention as
 * `getPage` — the metadata export and the page body share this one query.
 */
export async function getPost(slug: string): Promise<Post | null> {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'posts',
      where: { slug: { equals: slug }, _status: { equals: 'published' } },
      draft: false,
      depth: 2,
      limit: 1,
    })
    return docs[0] ?? null
  } catch {
    return null
  }
}
