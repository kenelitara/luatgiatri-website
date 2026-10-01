import { describe, expect, it } from 'vitest'
import { lexicalText } from './seo-helpers'

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
