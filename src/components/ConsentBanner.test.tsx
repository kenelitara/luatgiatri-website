import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { ConsentBanner } from './ConsentBanner'

// SSR render only (the HeroCarousel.test.tsx house pattern): effects never run
// under renderToStaticMarkup, so `localStorage` is never touched here. The
// accept path — click → #ga4-script injected — is covered end to end by Task
// 14's Playwright test, not here.
describe('ConsentBanner (spec §9 — consent gates GA4)', () => {
  it('renders the banner when a GA4 id is configured', () => {
    const html = renderToStaticMarkup(<ConsentBanner ga4Id="G-TEST123" />)
    expect(html).toContain('Thông báo cookie')
    expect(html).toContain('Đồng ý')
    expect(html).toContain('Từ chối')
  })

  it('renders nothing when no GA4 id is configured', () => {
    expect(renderToStaticMarkup(<ConsentBanner ga4Id={undefined} />)).toBe('')
  })
})
