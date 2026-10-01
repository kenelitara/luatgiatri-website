import { afterEach, describe, expect, it } from 'vitest'
import { buildMetadata } from './metadata'

const ORIG = { ...process.env }
afterEach(() => {
  process.env = { ...ORIG }
})

describe('buildMetadata (spec §6.1)', () => {
  it('composes the title with the brand template', () => {
    process.env.SITE_ENV = 'production'
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://luatgiatri.com'
    const m = buildMetadata({ title: 'Giới thiệu', path: '/gioi-thieu/' })
    expect(m.title).toBe('Giới thiệu | Luật Gia Trí')
  })

  it('produces an absolute canonical with the trailing-slash policy', () => {
    process.env.SITE_ENV = 'production'
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://luatgiatri.com'
    const m = buildMetadata({ title: 'X', path: '/dich-vu-ke-toan/' })
    expect(m.alternates?.canonical).toBe('https://luatgiatri.com/dich-vu-ke-toan/')
    // no double slash, slash added when missing
    const m2 = buildMetadata({ title: 'X', path: '/gioi-thieu' })
    expect(m2.alternates?.canonical).toBe('https://luatgiatri.com/gioi-thieu/')
  })

  it('defaults to index,follow in production and noindex,nofollow on staging', () => {
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://luatgiatri.com'
    process.env.SITE_ENV = 'production'
    expect(buildMetadata({ title: 'X', path: '/x/' }).robots).toMatchObject({
      index: true,
      follow: true,
    })
    process.env.SITE_ENV = 'staging'
    expect(buildMetadata({ title: 'X', path: '/x/' }).robots).toMatchObject({
      index: false,
      follow: false,
    })
  })

  it('honours a per-record noindex toggle (still follow)', () => {
    process.env.SITE_ENV = 'production'
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://luatgiatri.com'
    const m = buildMetadata({ title: 'X', path: '/x/', noindex: true })
    expect(m.robots).toMatchObject({ index: false, follow: true })
  })

  it('sets vi_VN OpenGraph and article type for posts', () => {
    process.env.SITE_ENV = 'production'
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://luatgiatri.com'
    const m = buildMetadata({ title: 'X', path: '/tin-tuc/a/', type: 'article' })
    expect(m.openGraph).toMatchObject({ locale: 'vi_VN', type: 'article' })
    expect(m.openGraph?.siteName).toBe('Luật Gia Trí')
  })

  it('falls back to the default OG image, and accepts an override', () => {
    process.env.SITE_ENV = 'production'
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://luatgiatri.com'
    const withDefault = buildMetadata({
      title: 'X',
      path: '/x/',
      defaultOgImage: '/api/media/file/og.png',
    })
    expect(withDefault.openGraph?.images).toEqual(['https://luatgiatri.com/api/media/file/og.png'])
    const withOverride = buildMetadata({
      title: 'X',
      path: '/x/',
      ogImage: '/api/media/file/custom.png',
      defaultOgImage: '/api/media/file/og.png',
    })
    expect(withOverride.openGraph?.images).toEqual([
      'https://luatgiatri.com/api/media/file/custom.png',
    ])
  })

  it('accepts a canonical override verbatim', () => {
    process.env.SITE_ENV = 'production'
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://luatgiatri.com'
    const m = buildMetadata({ title: 'X', path: '/x/', canonicalOverride: 'https://example.com/y' })
    expect(m.alternates?.canonical).toBe('https://example.com/y')
  })
})
