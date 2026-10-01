import { describe, expect, it } from 'vitest'
import { searchableText } from './search-text'

/** the exact shape Payload stores for a richText field (the { root } envelope) */
const envelope = {
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        version: 0,
        children: [{ type: 'text', version: 0, text: 'kế toán' }],
      },
    ],
  },
}

describe('searchableText', () => {
  // The load-bearing case: an envelope that was NOT unwrapped would make every
  // doc's vector empty and search silently useless (M3 Task 4 bug).
  it('includes the Lexical body text for the { root } envelope shape', () => {
    const text = searchableText({ title: 'X', body: envelope })
    expect(text).toContain('kế toán')
  })

  it('includes the Lexical body text for a bare-root shape', () => {
    expect(searchableText({ title: 'X', body: envelope.root })).toContain('kế toán')
  })

  it('joins title, primaryHeading and excerpt', () => {
    const text = searchableText({
      title: 'Dịch vụ kế toán',
      primaryHeading: 'Kế toán trọn gói',
      excerpt: 'Tóm tắt ngắn',
    })
    expect(text).toBe('Dịch vụ kế toán Kế toán trọn gói Tóm tắt ngắn')
  })

  it('includes `name` (categories carry a name, not a title)', () => {
    expect(searchableText({ name: 'Tin công ty' })).toBe('Tin công ty')
  })

  it('collapses whitespace and ignores non-string / missing fields', () => {
    expect(searchableText({ title: '  A \n  B ', excerpt: 42 })).toBe('A B')
    expect(searchableText({})).toBe('')
  })

  it('does not cap the body at the meta-description length', () => {
    const long = {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            version: 0,
            children: [{ type: 'text', version: 0, text: 'a'.repeat(500) }],
          },
        ],
      },
    }
    expect(searchableText({ body: long })).toHaveLength(500)
  })
})
