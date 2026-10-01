import type { Page, Post, SiteSetting } from '@/payload-types'
import type { MetadataInput } from './metadata'
import { mediaUrl } from './media'

/**
 * Extract the plain-text excerpt of a Lexical body for meta descriptions
 * (first `max` chars).
 *
 * Payload stores a richText field as the ENVELOPE `{ root: { type: 'root',
 * children: [...] } }` — the envelope itself has neither `.text` nor
 * `.children`, so the walk must start at `body.root`. A bare root node
 * (`{ type: 'root', children: [...] }`) is also accepted (callers that pass
 * `field.root` directly). Empty/malformed input yields `''`, never a throw.
 */
export function lexicalText(body: unknown, max = 160): string {
  const root = (body as { root?: unknown } | null | undefined)?.root ?? body
  const out: string[] = []
  const walk = (node: any): void => {
    if (!node || typeof node !== 'object') return
    if (typeof node.text === 'string') out.push(node.text)
    if (Array.isArray(node.children)) node.children.forEach(walk)
  }
  walk(root)
  return out.join(' ').replace(/\s+/g, ' ').trim().slice(0, max)
}

export function pageMetadata(page: Page, settings?: SiteSetting | null): MetadataInput {
  const isHome = page.slug === 'home'
  return {
    // the brand is appended by buildMetadata (spec §6.9) unless the page has an
    // explicit metaTitle (treated as editor-complete); the includes(brand) guard
    // still prevents any doubling. Home is NOT special-cased (2026-10-01).
    title: page.seo?.metaTitle || page.primaryHeading || page.title,
    branded: !page.seo?.metaTitle,
    description: page.seo?.metaDescription || undefined,
    path: isHome ? '/' : `/${page.slug}/`,
    noindex: page.seo?.noindex ?? false,
    canonicalOverride: page.seo?.canonicalOverride ?? null,
    ogImage: mediaUrl(page.seo?.ogImage ?? null),
    defaultOgImage: mediaUrl(settings?.defaultOgImage ?? null),
    brandName: settings?.brandName ?? undefined,
  }
}

export function postMetadata(post: Post, settings?: SiteSetting | null): MetadataInput {
  return {
    title: post.seo?.metaTitle || post.title,
    description: post.seo?.metaDescription || post.excerpt || lexicalText(post.body),
    path: `/tin-tuc/${post.slug}/`,
    type: 'article',
    noindex: post.seo?.noindex ?? false,
    canonicalOverride: post.seo?.canonicalOverride ?? null,
    ogImage: mediaUrl(post.seo?.ogImage ?? null),
    defaultOgImage: mediaUrl(settings?.defaultOgImage ?? null),
    publishedTime: post.publishedAt ?? null,
    modifiedTime: post.updatedAt ?? null,
    brandName: settings?.brandName ?? undefined,
  }
}

/** The non-record routes (news index, fallbacks): settings-only brand + default OG. */
export function staticMetadata(
  input: { title: string; description?: string; path: string },
  settings?: SiteSetting | null,
): MetadataInput {
  return {
    ...input,
    defaultOgImage: mediaUrl(settings?.defaultOgImage ?? null),
    brandName: settings?.brandName ?? undefined,
  }
}
