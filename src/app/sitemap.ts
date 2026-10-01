import type { MetadataRoute } from 'next'
import { getPayloadClient } from '@/lib/getPayload'
import { getBaseUrl } from '@/lib/site-env'
import { isReservedRootSegment } from '@/lib/reserved-slugs'

// GENERATED ON DEMAND, deliberately. `sitemap.ts` is a route OUTPUT, not a
// page: crawlers fetch it a few times a day, never per user request, so paying
// one render per fetch buys a correctness guarantee. The production image is
// built DB-LESS (AGENTS.md, Docker stack), so a prerendered sitemap bakes an
// EMPTY <urlset> — and a STATIC one never heals, leaving the site with no
// sitemap at all until the next deploy. `revalidate = 60` would heal it too,
// but only AFTER a window in which Googlebot can still fetch the empty
// build-time file — a smaller copy of the exact bug being fixed, re-created on
// every deploy. (Route-segment config is honoured here: sitemap.ts is a special
// Route Handler, cached by default unless it uses a dynamic option, and
// `cacheComponents` is NOT enabled in next.config.ts.)
export const dynamic = 'force-dynamic'

const base = () => getBaseUrl().replace(/\/+$/, '')

/**
 * Sitemap for the published surface (spec §6.6): pages, posts, and (from
 * Task 10 on) categories. Real lastModified from Payload's updatedAt.
 * /tim-kiem and the admin/API paths are deliberately absent. An unreachable DB
 * yields an empty list rather than a 500 — and because nothing is cached, the
 * very next request retries against a live DB.
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
      // A reserved root segment (admin, api, og, tin-tuc, tim-kiem, …) is not
      // servable by the dynamic route, so advertising it would be exactly the
      // "sitemap points at a 404" defect this task fixes. The collection
      // validation prevents creating one; this is the belt to that suspenders.
      if (isReservedRootSegment(p.slug)) continue
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
    // Unreachable DB: serve an empty (but valid) sitemap for this request only.
    // Nothing is cached, so the next fetch renders again with a live DB.
  }
  return entries
}
