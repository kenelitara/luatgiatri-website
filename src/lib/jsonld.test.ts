import { describe, expect, it } from 'vitest'
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildLegalServiceSchema,
  buildPersonSchema,
  buildServiceSchema,
  buildWebSiteSchema,
} from './jsonld'

const settings = {
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
  defaultOgImage: { url: '/api/media/file/og.png', alt: 'OG' },
} as never

describe('jsonld builders (spec §6.3)', () => {
  it('legalService carries the correct NAP + sameAs', () => {
    const s = buildLegalServiceSchema(settings, 'https://luatgiatri.com')
    expect(s['@type']).toBe('LegalService')
    expect(s.name).toBe('Luật Gia Trí')
    expect(s.telephone).toBe('0919088119')
    expect(s.address).toMatchObject({
      '@type': 'PostalAddress',
      addressLocality: 'TP.HCM',
      addressRegion: 'Bình Tân',
    })
    expect(s.sameAs).toContain('https://facebook.com/x')
  })

  it('webSite carries SearchAction pointing at /tim-kiem/', () => {
    const s = buildWebSiteSchema('https://luatgiatri.com')
    expect(s.potentialAction).toMatchObject({
      '@type': 'SearchAction',
      target: { urlTemplate: 'https://luatgiatri.com/tim-kiem/?q={search_term_string}' },
    })
  })

  it('breadcrumb maps items to ListItems with absolute URLs', () => {
    const s = buildBreadcrumbSchema(
      [
        { name: 'Trang chủ', path: '/' },
        { name: 'Giới thiệu', path: '/gioi-thieu/' },
      ],
      'https://luatgiatri.com',
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

  it('article links the author Person and the publisher', () => {
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
    expect(s.publisher).toMatchObject({ '@type': 'Organization', name: 'Luật Gia Trí' })
  })

  it('person carries credentials for E-E-A-T', () => {
    const s = buildPersonSchema({ name: 'Nguyễn Minh Trí', credentials: 'CCCH 123' })
    expect(s).toMatchObject({
      '@type': 'Person',
      name: 'Nguyễn Minh Trí',
      hasCredential: 'CCCH 123',
    })
  })
})
