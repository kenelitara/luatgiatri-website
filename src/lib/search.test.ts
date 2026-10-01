import { describe, expect, it } from 'vitest'
import { normalizeQuery, toResult } from './search'

describe('search helpers (spec §7)', () => {
  it('collapses whitespace and caps length', () => {
    expect(normalizeQuery('  ke   toan \n')).toBe('ke toan')
    expect(normalizeQuery(undefined)).toBe('')
    expect(normalizeQuery('x'.repeat(500)).length).toBe(120)
  })

  it('maps rows to public URLs', () => {
    expect(toResult({ type: 'page', title: 'X', slug: 'home', excerpt: null, score: 1 }).url).toBe(
      '/',
    )
    expect(
      toResult({ type: 'page', title: 'X', slug: 'gioi-thieu', excerpt: null, score: 1 }).url,
    ).toBe('/gioi-thieu/')
    expect(toResult({ type: 'post', title: 'X', slug: 'a', excerpt: 'e', score: 1 }).url).toBe(
      '/tin-tuc/a/',
    )
    expect(
      toResult({ type: 'category', title: 'X', slug: 'tin-cong-ty', excerpt: null, score: 1 }).url,
    ).toBe('/tin-tuc/chuyen-muc/tin-cong-ty/')
  })
})
