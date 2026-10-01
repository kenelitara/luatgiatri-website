import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

// next/image and next/link need the Next runtime; the unit test asserts DOM
// structure, so mock them with the plain elements they ultimately emit.
// Both modules are default-export modules (next/image → image-external,
// next/link → client/link), so the mocks must define `default` — and both
// also expose the same component as a named export, so we provide both
// shapes to match the real module surface.
vi.mock('next/image', () => {
  const Image = (props: { src: string; alt: string }) =>
    `<img src="${props.src}" alt="${props.alt}" />`
  return { default: Image, Image }
})
vi.mock('next/link', () => {
  const Link = (props: { href: string; children: unknown }) =>
    `<a href="${props.href}">${props.children}</a>`
  return { default: Link, Link }
})

import { HeroCarousel } from './HeroCarousel'

const slides = [
  {
    image: { url: '/a.jpg', alt: 'Ảnh A' },
    headline: 'Thành lập doanh nghiệp',
    ctaLabel: 'Tìm hiểu',
    ctaHref: '/thanh-lap-doanh-nghiep-tron-goi/',
  },
  {
    image: { url: '/b.jpg', alt: 'Ảnh B' },
    headline: 'Kế toán thuế',
    ctaLabel: 'Tìm hiểu',
    ctaHref: '/dich-vu-ke-toan/',
  },
]

describe('HeroCarousel (spec §6.8)', () => {
  it('renders EVERY slide copy in the HTML for crawlers', () => {
    const html = renderToStaticMarkup(<HeroCarousel slides={slides} intervalMs={6000} />)
    expect(html).toContain('Thành lập doanh nghiệp')
    expect(html).toContain('Kế toán thuế')
  })

  it('marks inactive slides inert and aria-hidden (never unmounts)', () => {
    const html = renderToStaticMarkup(<HeroCarousel slides={slides} intervalMs={6000} />)
    expect(html).toContain('inert')
    expect(html).toContain('aria-hidden="true"')
  })

  it('single slide → no autoplay/dots/pause, no client behavior', () => {
    const html = renderToStaticMarkup(<HeroCarousel slides={[slides[0]]} intervalMs={6000} />)
    expect(html).toContain('Thành lập doanh nghiệp')
    expect(html).not.toContain('data-carousel-dots')
    expect(html).not.toContain('Tạm dừng')
  })
})
