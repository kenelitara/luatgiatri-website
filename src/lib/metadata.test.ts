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

  it('threads brandName from SiteSettings into the title suffix and siteName', () => {
    process.env.SITE_ENV = 'production'
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://luatgiatri.com'
    const m = buildMetadata({ title: 'X', path: '/x/', brandName: 'Công ty ABC' })
    expect(m.title).toBe('X | Công ty ABC')
    expect(m.openGraph?.siteName).toBe('Công ty ABC')
  })

  it('strips query/hash and forces a leading slash on the canonical', () => {
    process.env.SITE_ENV = 'production'
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://luatgiatri.com'
    expect(buildMetadata({ title: 'X', path: '/tim-kiem/?q=ke+toan' }).alternates?.canonical).toBe(
      'https://luatgiatri.com/tim-kiem/',
    )
    expect(buildMetadata({ title: 'X', path: 'gioi-thieu' }).alternates?.canonical).toBe(
      'https://luatgiatri.com/gioi-thieu/',
    )
    expect(buildMetadata({ title: 'X', path: '/gioi-thieu#top' }).alternates?.canonical).toBe(
      'https://luatgiatri.com/gioi-thieu/',
    )
    expect(buildMetadata({ title: 'X', path: '/' }).alternates?.canonical).toBe(
      'https://luatgiatri.com/',
    )
  })

  it('emits the title verbatim when branded is false, suffixed by default', () => {
    process.env.SITE_ENV = 'production'
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://luatgiatri.com'
    const unbranded = buildMetadata({ title: 'Luật Gia Trí', path: '/', branded: false })
    expect(unbranded.title).toBe('Luật Gia Trí')
    const branded = buildMetadata({ title: 'Luật Gia Trí', path: '/' })
    expect(branded.title).toBe('Luật Gia Trí | Luật Gia Trí')
  })

  it('passes protocol-relative image URLs through with https:', () => {
    process.env.SITE_ENV = 'production'
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://luatgiatri.com'
    const m = buildMetadata({ title: 'X', path: '/x/', ogImage: '//cdn.example.com/x.png' })
    expect(m.openGraph?.images).toEqual(['https://cdn.example.com/x.png'])
  })

  it('uses a summary twitter card without an image, large image with one', () => {
    process.env.SITE_ENV = 'production'
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://luatgiatri.com'
    expect(buildMetadata({ title: 'X', path: '/x/' }).twitter).toMatchObject({ card: 'summary' })
    const withImage = buildMetadata({ title: 'X', path: '/x/', ogImage: '/api/media/file/og.png' })
    expect(withImage.twitter).toMatchObject({ card: 'summary_large_image' })
  })

  it('treats an empty-string description as absent', () => {
    process.env.SITE_ENV = 'production'
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://luatgiatri.com'
    const m = buildMetadata({ title: 'X', path: '/x/', description: '' })
    expect(m.description).toBeUndefined()
    expect(m.openGraph?.description).toBeUndefined()
  })
})
