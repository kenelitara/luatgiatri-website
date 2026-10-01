import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageShell } from '@/components/PageShell'
import { getPage, getPublishedPageSlugs } from '@/lib/getPage'
import { getSiteSettings } from '@/lib/site'
import { buildMetadata, DEFAULT_BRAND } from '@/lib/metadata'
import { pageMetadata } from '@/lib/seo-helpers'
import { isReservedSlug } from '@/lib/reserved-slugs'

export const revalidate = 60 // same ISR window as every other record page

/**
 * The dynamic fallback for CMS-created Pages. The ten original pages each have
 * their own route file under `(frontend)/`; a STATIC segment wins over this
 * dynamic one for its own slug, so those pages keep their exact current
 * behaviour — including the DB-less build fallback the M1–M3 gates verified.
 * This route exists for pages an editor creates beyond that fixed set, which
 * previously 404'd while `/sitemap.xml` advertised them.
 */
const FIXED_ROUTE_SLUGS = [
  'home',
  'gioi-thieu',
  'thanh-lap-doanh-nghiep-tron-goi',
  'dich-vu-ke-toan',
  'hoa-don-dien-tu',
  'chu-ky-so-token',
  'dich-vu-lien-ket',
  'ho-tro-doanh-nghiep',
  'lien-he',
  'chinh-sach-bao-mat',
]

/**
 * DB-SAFE by construction (M2 convention, AGENTS.md): the docker builder stage
 * has no database, so `getPublishedPageSlugs` returns [] rather than throwing —
 * the build never fails, nothing is prerendered by this route, and no known
 * page is ever baked as a 404. Fixed-route slugs are filtered out so a static
 * route file always keeps ownership of its own path.
 */
export async function generateStaticParams() {
  const slugs = await getPublishedPageSlugs()
  return slugs
    .filter((slug) => !isReservedSlug(slug) && !FIXED_ROUTE_SLUGS.includes(slug))
    .map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  if (isReservedSlug(slug)) {
    return buildMetadata({ title: DEFAULT_BRAND, path: `/${slug}/`, branded: false })
  }
  const [page, settings] = await Promise.all([getPage(slug), getSiteSettings()])
  if (!page) return buildMetadata({ title: DEFAULT_BRAND, path: `/${slug}/`, branded: false })
  return buildMetadata(pageMetadata(page, settings))
}

export default async function DynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  // Reserved root segments belong to the admin/API/OG/news/search routes, never
  // to a Pages record — refuse before touching the DB.
  if (isReservedSlug(slug)) notFound()
  const page = await getPage(slug)
  if (!page) notFound()
  // The same shell + metadata helpers as the fixed routes: one code path for
  // the render, the <h1>, metadata, JSON-LD and breadcrumbs.
  return <PageShell page={page} />
}
