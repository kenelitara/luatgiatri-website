import { describe, expect, it } from 'vitest'
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildLegalServiceSchema,
  buildPersonSchema,
  buildServiceSchema,
  buildWebSiteSchema,
  legalServiceId,
  type SettingsLike,
} from './jsonld'

const BASE = 'https://luatgiatri.com'

const settings: SettingsLike = {
  brandName: 'Luật Gia Trí',
  hotline: '0919088119',
  email: 'luatsu@luatgiatri.com',
  address: {
    street: '54/16 Đường số 2',
    ward: null,
    district: 'Bình Tân',
    city: 'TP.HCM',
    country: 'VN',
  },
  socials: {
    facebook: 'https://facebook.com/x',
    zalo: null,
    youtube: null,
    googleBusinessProfile: null,
  },
  openingHours: 'Mo-Fr 08:00-17:30',
}

describe('jsonld builders (spec §6.3)', () => {
  it('legalService carries the NAP, the sitewide @id, areaServed, openingHours + sameAs', () => {
    const s = buildLegalServiceSchema(settings, BASE)
    expect(s['@type']).toBe('LegalService')
    expect(s['@id']).toBe('https://luatgiatri.com/#legalservice')
    expect(s.name).toBe('Luật Gia Trí')
    expect(s.telephone).toBe('0919088119')
    expect(s.address).toMatchObject({
      '@type': 'PostalAddress',
      addressLocality: 'TP.HCM',
      addressRegion: 'Bình Tân',
    })
    expect(s.areaServed).toMatchObject({ '@type': 'City', name: 'TP.HCM' })
    expect(s.openingHours).toBe('Mo-Fr 08:00-17:30')
    expect(s.sameAs).toContain('https://facebook.com/x')
  })

  it('legalService emits logo/image/priceRange only when the firm has set them', () => {
    const bare = buildLegalServiceSchema(settings, BASE)
    expect(bare.logo).toBeUndefined()
    expect(bare.image).toBeUndefined()
    expect(bare.priceRange).toBeUndefined()

    const withLogo = buildLegalServiceSchema(
      {
        ...settings,
        logo: { url: '/api/media/file/logo.png', alt: 'Logo' },
        priceRange: '500.000đ - 20.000.000đ',
      },
      BASE,
    )
    expect(withLogo.logo).toBe('https://luatgiatri.com/api/media/file/logo.png')
    expect(withLogo.image).toBe('https://luatgiatri.com/api/media/file/logo.png')
    expect(withLogo.priceRange).toBe('500.000đ - 20.000.000đ')
  })

  it('webSite carries SearchAction pointing at /tim-kiem/', () => {
    const s = buildWebSiteSchema(BASE, 'Luật Gia Trí')
    expect(s.name).toBe('Luật Gia Trí')
    expect(s.potentialAction).toMatchObject({
      '@type': 'SearchAction',
      target: { urlTemplate: 'https://luatgiatri.com/tim-kiem/?q={search_term_string}' },
    })
    // the brand comes from the caller, never a literal (spec §6.1)
    const custom = buildWebSiteSchema(BASE, 'Công ty ABC')
    expect(custom.name).toBe('Công ty ABC')
  })

  it('breadcrumb maps items to ListItems with absolute URLs', () => {
    const s = buildBreadcrumbSchema(
      [
        { name: 'Trang chủ', path: '/' },
        { name: 'Giới thiệu', path: '/gioi-thieu/' },
      ],
      BASE,
    )
    expect(s.itemListElement).toHaveLength(2)
    expect(s.itemListElement[1]).toMatchObject({
      '@type': 'ListItem',
      position: 2,
      item: 'https://luatgiatri.com/gioi-thieu/',
    })
  })

  it('service builds offers from the pricing block rows (fees the client edits)', () => {
    const s = buildServiceSchema({
      name: 'Dịch vụ kế toán',
      description: 'Mô tả',
      url: 'https://luatgiatri.com/dich-vu-ke-toan/',
      provider: 'Luật Gia Trí',
      offers: [{ name: 'Gói cơ bản', price: '1.500.000đ' }],
    })
    expect(s.offers).toHaveLength(1)
    expect(s.offers[0]).toMatchObject({ '@type': 'Offer', name: 'Gói cơ bản', price: '1.500.000đ' })
  })

  it('faq builds a FAQPage from question/answer pairs', () => {
    const s = buildFaqSchema([{ question: 'Bao lâu?', answer: '3 ngày' }])
    expect(s.mainEntity).toHaveLength(1)
    expect(s.mainEntity[0]).toMatchObject({ '@type': 'Question', name: 'Bao lâu?' })
  })

  it('article links the author Person (context-free) and the publisher', () => {
    const s = buildArticleSchema({
      headline: 'Tin A',
      description: 'Mô tả',
      url: 'https://luatgiatri.com/tin-tuc/a/',
      datePublished: '2026-10-01',
      dateModified: '2026-10-01',
      author: { name: 'Nguyễn Minh Trí', credentials: 'CCCH 123' },
      publisher: 'Luật Gia Trí',
    })
    expect(s.author).toMatchObject({ '@type': 'Person', name: 'Nguyễn Minh Trí' })
    // only top-level nodes carry @context
    expect(s.author).not.toHaveProperty('@context')
    expect(s.publisher).toMatchObject({ '@type': 'Organization', name: 'Luật Gia Trí' })
  })

  it('article accepts @id references so every page describes one entity (§6.9)', () => {
    const id = legalServiceId(BASE)
    expect(id).toBe('https://luatgiatri.com/#legalservice')
    const ref = buildArticleSchema({
      headline: 'Tin A',
      url: 'https://luatgiatri.com/tin-tuc/a/',
      author: { '@id': id },
      publisher: { '@id': id },
    })
    expect(ref.author).toEqual({ '@id': 'https://luatgiatri.com/#legalservice' })
    expect(ref.publisher).toEqual({ '@id': 'https://luatgiatri.com/#legalservice' })
    // a bare name still builds the full node
    const byName = buildArticleSchema({
      headline: 'Tin A',
      url: 'https://luatgiatri.com/tin-tuc/a/',
      author: 'Nguyễn Minh Trí',
      publisher: 'Luật Gia Trí',
    })
    expect(byName.author).toMatchObject({ '@type': 'Person', name: 'Nguyễn Minh Trí' })
    expect(byName.publisher).toMatchObject({ '@type': 'Organization', name: 'Luật Gia Trí' })
  })

  it('person carries credentials for E-E-A-T and its own @context', () => {
    const s = buildPersonSchema({ name: 'Nguyễn Minh Trí', credentials: 'CCCH 123' })
    expect(s['@context']).toBe('https://schema.org')
    expect(s).toMatchObject({
      '@type': 'Person',
      name: 'Nguyễn Minh Trí',
      hasCredential: { '@type': 'EducationalOccupationalCredential', name: 'CCCH 123' },
    })
  })
})
