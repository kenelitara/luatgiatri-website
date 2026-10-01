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
