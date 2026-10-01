import { describe, expect, it } from 'vitest'
import type { Page, Post } from '@/payload-types'
import { lexicalText, pageMetadata, postMetadata } from './seo-helpers'

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
