import type { Page, SiteSetting } from '@/payload-types'
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildLegalServiceSchema,
  buildServiceSchema,
  buildWebSiteSchema,
  legalServiceId,
} from './jsonld'
import { lexicalText } from './seo-helpers'
import { getBaseUrl } from './site-env'

/**
 * Adapters that turn Payload records into the JSON-LD builders' inputs
 * (spec §6.3). Kept separate from `jsonld.ts` so the builders stay
 * Payload-free and unit-testable; the mapping lives here, where the generated
 * types are already in scope.
 */

/** Sitewide: LegalService + WebSite on every page (layout-level). */
export function sitewideSchemas(settings: SiteSetting | null) {
  const base = getBaseUrl().replace(/\/+$/, '')
  if (!settings) return []
  return [
    buildLegalServiceSchema(settings, base), // structural assignability — no cast
    buildWebSiteSchema(base, settings.brandName), // brand from the single source
  ]
}

/** Per-page: breadcrumb always; Service from serviceMeta + pricing blocks; FAQ from faq blocks. */
export function pageSchemas(page: Page) {
  const base = getBaseUrl().replace(/\/+$/, '')
  const out: object[] = []
  if (page.slug !== 'home') {
    out.push(
      buildBreadcrumbSchema(
        [
          { name: 'Trang chủ', path: '/' },
          { name: page.primaryHeading, path: `/${page.slug}/` },
        ],
        base,
      ),
    )
  }
  const blocks = page.layout ?? []
  const faqItems = blocks.flatMap((b) =>
    b.blockType === 'faq'
      ? (b.items ?? []).map((i) => ({ question: i.question, answer: lexicalText(i.answer, 500) }))
      : [],
  )
  if (faqItems.length) out.push(buildFaqSchema(faqItems))

  const offers = blocks.flatMap((b) =>
    b.blockType === 'pricingTable'
      ? (b.groups ?? []).flatMap((g) =>
          (g.rows ?? []).map((r) => ({ name: r.service, price: r.fee })),
        )
      : [],
  )
  if (page.serviceMeta?.serviceName && offers.length) {
    out.push(
      buildServiceSchema({
        name: page.serviceMeta.serviceName,
        description: page.serviceMeta.shortDescription,
        url: `${base}/${page.slug}/`,
        provider: 'Luật Gia Trí', // provider is typed as a name string in the builder
        offers,
      }),
    )
  }
  return out
}

/** The article input for a post route. Publisher links the sitewide entity by @id (one entity, §6.9). */
export function postSchemas(post: {
  title: string
  slug: string
  excerpt?: string | null
  publishedAt?: string | null
  updatedAt?: string | null
  author?: { name: string; credentials?: string | null } | null
}) {
  const base = getBaseUrl().replace(/\/+$/, '')
  return [
    buildArticleSchema({
      headline: post.title,
      description: post.excerpt ?? undefined,
      url: `${base}/tin-tuc/${post.slug}/`,
      datePublished: post.publishedAt ?? null,
      dateModified: post.updatedAt ?? null,
      author: post.author ? { name: post.author.name, credentials: post.author.credentials } : null,
      publisher: { '@id': legalServiceId(base) },
    }),
  ]
}
