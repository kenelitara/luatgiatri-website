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

/**
 * The meta-description ceiling (Google's practical ~160-char limit, spec §10.1
 * item 4). The admin SEO panel's counter (`SeoPreview.tsx` — `DESC_MIN/DESC_MAX`)
 * uses the same 150–160 window, so an editor writing a page description sees
 * exactly this bound in the SERP preview.
 */
export const META_DESCRIPTION_MAX = 160

/**
 * Truncate plain text to at most `max` chars, preferring to end on a word
 * boundary so a description never cuts a word in half. Whitespace is collapsed
 * first, matching `lexicalText`. This is the shared slicer for the derived
 * description chain below: `serviceMeta.shortDescription` is a plain `textarea`
 * (not Lexical) and takes this path directly, while the richText tier extracts
 * with `lexicalText` and then reuses this for the boundary-aware cut.
 */
export function truncateText(text: string, max = META_DESCRIPTION_MAX): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  const boundary = cut.lastIndexOf(' ')
  // `> 0` guards a single long token with no space: there is no boundary to
  // prefer, so hard-cut at `max`.
  return (boundary > 0 ? cut.slice(0, boundary) : cut).trim()
}

/**
 * The page's meta description, DERIVED from content already in the system — no
 * new copy is authored (content law, spec §3.2). Priority (spec §10.1 item 4):
 *
 *   1. `seo.metaDescription` — the editor's explicit override (admin SEO panel).
 *   2. `serviceMeta.shortDescription` — the purpose-made service summary, present
 *      on the six service pages (e.g. `dich-vu-lien-ket` is 603 chars → capped).
 *   3. the first `richText` block body — real ported prose (e.g. `gioi-thieu`).
 *   4. `primaryHeading` — last resort for a page with no prose at all.
 *
 * `postMetadata` has carried an excerpt chain since M1; `pageMetadata` had none,
 * so 9 of 11 public pages emitted no description at all. Every value is capped at
 * `META_DESCRIPTION_MAX` on a word boundary.
 */
function pageDescription(page: Page): string | undefined {
  const richTextBlock = page.layout?.find((b) => b.blockType === 'richText')
  // `Infinity`: take the whole body, let `truncateText` pick the word boundary.
  const richText =
    richTextBlock && richTextBlock.blockType === 'richText'
      ? lexicalText(richTextBlock.body, Number.POSITIVE_INFINITY)
      : ''
  const source =
    page.seo?.metaDescription ||
    page.serviceMeta?.shortDescription ||
    richText ||
    page.primaryHeading
  return truncateText(source ?? '') || undefined
}

export function pageMetadata(page: Page, settings?: SiteSetting | null): MetadataInput {
  const isHome = page.slug === 'home'
  return {
    // the brand is appended by buildMetadata (spec §6.9) unless the page has an
    // explicit metaTitle (treated as editor-complete); the includes(brand) guard
    // still prevents any doubling. Home is NOT special-cased (2026-10-01).
    title: page.seo?.metaTitle || page.primaryHeading || page.title,
    branded: !page.seo?.metaTitle,
    // Derived fallback chain (spec §10.1 item 4) — see `pageDescription` above.
    description: pageDescription(page),
    path: isHome ? '/' : `/${page.slug}/`,
    noindex: page.seo?.noindex ?? false,
    canonicalOverride: page.seo?.canonicalOverride ?? null,
    ogImage: mediaUrl(page.seo?.ogImage ?? null),
    defaultOgImage: mediaUrl(settings?.defaultOgImage ?? null),
    // Task 13: a record with no editor-chosen image gets its own generated OG
    // (title rendered over the brand plate) instead of an imageless card.
    // The TRAILING SLASH is load-bearing: `trailingSlash: true` makes the slash
    // form the canonical, directly-servable URL, so the bare form would 308 and
    // strict OG fetchers that do not follow it would drop the image entirely —
    // the same class of bug as the media-URL redirect in AGENTS.md.
    fallbackOgImage: page.slug ? `/og/page/${page.slug}/` : null,
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
    // Task 13: same generated-OG fallback as pages (`/og/post/<slug>/`) —
    // trailing slash for the same canonical-URL reason.
    fallbackOgImage: post.slug ? `/og/post/${post.slug}/` : null,
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
