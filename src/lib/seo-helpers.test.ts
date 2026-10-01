import { describe, expect, it } from 'vitest'
import type { Page, Post } from '@/payload-types'
import {
  META_DESCRIPTION_MAX,
  lexicalText,
  pageMetadata,
  postMetadata,
  truncateText,
} from './seo-helpers'

/** the exact shape Payload stores for a richText field */
const envelope = {
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        version: 0,
        children: [{ type: 'text', version: 0, text: 'Kế toán' }],
      },
    ],
  },
}

describe('lexicalText', () => {
  it('unwraps the Payload richText envelope ({ root: … })', () => {
    expect(lexicalText(envelope)).toBe('Kế toán')
  })

  it('accepts a bare root node (no envelope)', () => {
    expect(lexicalText(envelope.root)).toBe('Kế toán')
  })

  it('walks nested nodes (list → listitem → paragraph) and collapses whitespace', () => {
    const nested = {
      root: {
        type: 'root',
        children: [
          {
            type: 'list',
            listType: 'ul',
            tag: 'ul',
            version: 0,
            children: [
              {
                type: 'listitem',
                value: 1,
                version: 0,
                children: [
                  {
                    type: 'paragraph',
                    version: 0,
                    children: [{ type: 'text', version: 0, text: 'Mục   một' }],
                  },
                ],
              },
              {
                type: 'listitem',
                value: 2,
                version: 0,
                children: [
                  {
                    type: 'paragraph',
                    version: 0,
                    children: [{ type: 'text', version: 0, text: 'Mục hai' }],
                  },
                ],
              },
            ],
          },
        ],
      },
    }
    expect(lexicalText(nested)).toBe('Mục một Mục hai')
  })

  it('respects the max cap', () => {
    expect(lexicalText(envelope, 3)).toBe('Kế ')
    expect(lexicalText(envelope, 3)).toHaveLength(3)
  })

  it('returns an empty string for empty/malformed input without throwing', () => {
    expect(lexicalText({})).toBe('')
    expect(lexicalText(null)).toBe('')
    expect(lexicalText({ root: { type: 'root', children: [] } })).toBe('')
  })
})

describe('truncateText', () => {
  it('collapses whitespace and leaves short text untouched', () => {
    expect(truncateText('  Kế   toán  ')).toBe('Kế toán')
  })

  it('returns text exactly at the cap unchanged', () => {
    expect(truncateText('abc def', 7)).toBe('abc def')
  })

  it('cuts on a word boundary when over the cap', () => {
    // 'one two th' is the raw 10-char cut; the boundary backs up to 'one two'.
    expect(truncateText('one two three four', 10)).toBe('one two')
  })

  it('hard-cuts a single long token with no space to break on', () => {
    expect(truncateText('abcdefghijkl', 5)).toBe('abcde')
  })

  it('never leaves a trailing space', () => {
    expect(truncateText('one two three four', 10)).not.toMatch(/\s$/)
  })
})

// The defect this pins: `pageMetadata` used to emit NO description unless an
// editor had set one, while `postMetadata` carried a fallback chain — so 9 of
// 11 public pages had no <meta name="description"> at all (spec §10.1 item 4).
describe('page description fallback chain (spec §10.1 item 4)', () => {
  const richBody = {
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          version: 0,
          children: [{ type: 'text', version: 0, text: 'Đoạn văn giới thiệu.' }],
        },
      ],
    },
  }

  const makePage = (over: Record<string, unknown> = {}) =>
    ({
      id: 1,
      title: 'Trang',
      slug: 'trang',
      primaryHeading: 'Tiêu đề H1',
      layout: [],
      ...over,
    }) as unknown as Page

  it('tier 1 — the editor override beats every derived tier', () => {
    const page = makePage({
      seo: { metaDescription: 'Mô tả thủ công' },
      serviceMeta: { shortDescription: 'Mô tả dịch vụ' },
      layout: [{ blockType: 'richText', body: richBody }],
    })
    expect(pageMetadata(page).description).toBe('Mô tả thủ công')
  })

  it('tier 2 — serviceMeta.shortDescription beats the richText body', () => {
    const page = makePage({
      serviceMeta: { shortDescription: 'Mô tả dịch vụ' },
      layout: [{ blockType: 'richText', body: richBody }],
    })
    expect(pageMetadata(page).description).toBe('Mô tả dịch vụ')
  })

  it('tier 3 — the first richText block body is extracted when no service summary', () => {
    const page = makePage({ layout: [{ blockType: 'richText', body: richBody }] })
    expect(pageMetadata(page).description).toBe('Đoạn văn giới thiệu.')
  })

  it('tier 3 — ignores non-richText blocks and takes the FIRST richText one', () => {
    const page = makePage({
      layout: [
        { blockType: 'hero', headline: 'Không phải văn bản' },
        { blockType: 'richText', body: richBody },
        { blockType: 'richText', body: { root: { type: 'root', children: [] } } },
      ],
    })
    expect(pageMetadata(page).description).toBe('Đoạn văn giới thiệu.')
  })

  it('tier 4 — primaryHeading is the last resort (no prose at all)', () => {
    expect(pageMetadata(makePage()).description).toBe('Tiêu đề H1')
  })

  it('falls through an empty-string override to the next tier', () => {
    const page = makePage({
      seo: { metaDescription: '' },
      serviceMeta: { shortDescription: 'Mô tả dịch vụ' },
    })
    expect(pageMetadata(page).description).toBe('Mô tả dịch vụ')
  })

  it('caps a long derived description at the ceiling, on a word boundary', () => {
    // 1000 chars — the shape of `dich-vu-lien-ket`'s 603-char shortDescription.
    const long = 'word '.repeat(200)
    const page = makePage({ serviceMeta: { shortDescription: long } })
    const desc = pageMetadata(page).description!
    expect(desc.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX)
    expect(META_DESCRIPTION_MAX).toBe(160)
    expect(desc.endsWith('word')).toBe(true)
    expect(desc).not.toMatch(/\s$/)
  })

  it('keeps the description inside the crawl assertion (≤300, spec §10.1)', () => {
    const page = makePage({ serviceMeta: { shortDescription: 'x'.repeat(900) } })
    expect(pageMetadata(page).description!.length).toBeLessThanOrEqual(300)
  })
})

describe('generated-OG fallback (Task 13)', () => {
  const page = (seo: Page['seo'], slug: string | null) =>
    ({ id: 1, title: 'Giới thiệu', primaryHeading: 'Giới thiệu', slug, seo }) as unknown as Page

  // The trailing slash is asserted deliberately: `trailingSlash: true` makes it
  // the canonical URL, and the bare form 308s (dropping the image for strict
  // OG fetchers) — see the note in seo-helpers.ts.
  it('points a page with no editor OG at /og/page/<slug>/', () => {
    expect(pageMetadata(page(undefined, 'gioi-thieu')).fallbackOgImage).toBe('/og/page/gioi-thieu/')
  })

  it('points a post with no editor OG at /og/post/<slug>/', () => {
    const post = {
      id: 1,
      title: 'Tin',
      primaryHeading: 'Tin',
      slug: 'tin-moi',
      body: { root: { children: [] } },
    } as unknown as Post
    expect(postMetadata(post).fallbackOgImage).toBe('/og/post/tin-moi/')
  })

  it('emits no fallback when the record has no slug', () => {
    expect(pageMetadata(page(undefined, null)).fallbackOgImage).toBeNull()
  })

  it('still records an editor-chosen OG separately (precedence lives in buildMetadata)', () => {
    const withOg = pageMetadata(
      page({ ogImage: { id: 9, url: '/api/media/file/x.png/' } } as Page['seo'], 'gioi-thieu'),
    )
    expect(withOg.ogImage).toBe('/api/media/file/x.png')
    expect(withOg.fallbackOgImage).toBe('/og/page/gioi-thieu/')
  })
})
