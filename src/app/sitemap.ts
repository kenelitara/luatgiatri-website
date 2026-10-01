import type { MetadataRoute } from 'next'
import { getPayloadClient } from '@/lib/getPayload'
import { getBaseUrl } from '@/lib/site-env'

const base = () => getBaseUrl().replace(/\/+$/, '')

/**
 * Sitemap for the published surface (spec §6.6): pages, posts, and (from
 * Task 10 on) categories. Real lastModified from Payload's updatedAt.
 * /tim-kiem and the admin/API paths are deliberately absent. The DB-at-build
 * convention applies: an unreachable DB yields an empty list rather than
 * failing the build.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []
  try {
    const payload = await getPayloadClient()

    const [pages, posts, categories] = await Promise.all([
      payload.find({
        collection: 'pages',
        limit: 200,
        draft: false,
        where: { _status: { equals: 'published' } },
      }),
      payload.find({
        collection: 'posts',
        limit: 500,
        draft: false,
        where: { _status: { equals: 'published' } },
      }),
      payload.find({ collection: 'categories', limit: 200 }),
    ])

    for (const p of pages.docs) {
      entries.push({
        url: `${base()}${p.slug === 'home' ? '/' : `/${p.slug}/`}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
        priority: p.slug === 'home' ? 1 : 0.8,
      })
    }
    for (const p of posts.docs) {
      entries.push({
        url: `${base()}/tin-tuc/${p.slug}/`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
        priority: 0.6,
      })
    }
    for (const c of categories.docs) {
      entries.push({
        url: `${base()}/tin-tuc/chuyen-muc/${c.slug}/`,
        lastModified: c.updatedAt ? new Date(c.updatedAt) : undefined,
        priority: 0.5,
      })
    }
    entries.push({ url: `${base()}/tin-tuc/`, priority: 0.6 })
  } catch {
    // DB-at-build convention (AGENTS.md): bake a minimal sitemap; ISR heals at runtime
  }
  return entries
}
