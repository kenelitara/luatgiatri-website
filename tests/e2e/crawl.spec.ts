import { expect, test } from '@playwright/test'

// The 9 preserved URLs + home + the news index + the privacy policy (spec §2.5, §6.7).
const PATHS = [
  '/',
  '/gioi-thieu/',
  '/thanh-lap-doanh-nghiep-tron-goi/',
  '/dich-vu-ke-toan/',
  '/hoa-don-dien-tu/',
  '/chu-ky-so-token/',
  '/dich-vu-lien-ket/',
  '/ho-tro-doanh-nghiep/',
  '/lien-he/',
  '/tin-tuc/',
  '/chinh-sach-bao-mat/',
]

// SITE_ENV is a BUILD-time input (spec §6.5): the served robots contract is
// whatever the build baked, not a runtime switch. Playwright does not read
// `.env`, so the runner's own SITE_ENV is the signal; the project default (and
// this repo's `.env`) is staging. The 3100 server under test must have been
// built with the same SITE_ENV, or these assertions describe the wrong build.
const STAGING = (process.env.SITE_ENV ?? 'staging') === 'staging'

test.describe('SEO crawl (spec §10.1)', () => {
  for (const path of PATHS) {
    test(`${path} — canonical, description, JSON-LD, robots`, async ({ page }) => {
      const res = await page.goto(path)
      expect(res?.status()).toBe(200)

      // absolute canonical ending in a slash (the home root ends in the origin slash)
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
      expect(canonical, 'canonical present').toBeTruthy()
      expect(canonical!.startsWith('http'), 'canonical absolute').toBe(true)
      expect(canonical!.endsWith('/'), 'canonical trailing slash').toBe(true)
      // the canonical must point at THIS route, not merely at some absolute URL
      expect(new URL(canonical!).pathname, 'canonical pathname').toBe(path)

      // meta description present and not absurdly long (spec §10.1 item 4).
      // Read it straight off the DOM rather than via a locator: `getAttribute`
      // auto-waits, so a page with NO description tag burns the full 30 s test
      // timeout per path instead of failing immediately.
      const desc = await page.evaluate(
        () => document.querySelector('meta[name="description"]')?.getAttribute('content') ?? null,
      )
      expect(desc, 'description present').toBeTruthy()
      expect(desc!.length).toBeLessThanOrEqual(300)

      // robots meta matches the build's SITE_ENV contract (spec §6.5)
      const robots = await page.locator('meta[name="robots"]').getAttribute('content')
      if (STAGING) expect(robots).toContain('noindex')
      else expect(robots).not.toContain('noindex')

      // every JSON-LD block parses and declares an @type
      const blocks = await page.locator('script[type="application/ld+json"]').allTextContents()
      expect(blocks.length, `${path} emits JSON-LD`).toBeGreaterThan(0)
      for (const b of blocks) {
        const parsed = JSON.parse(b) // throws → test fails
        const types = Array.isArray(parsed) ? parsed.map((x) => x['@type']) : [parsed['@type']]
        expect(types.filter(Boolean).length).toBeGreaterThan(0)
      }
    })
  }

  test('search results are noindex,follow', async ({ page }) => {
    await page.goto('/tim-kiem/?q=ke+toan')
    const robots = await page.locator('meta[name="robots"]').getAttribute('content')
    expect(robots).toContain('noindex')
    // The per-record opt-out is `{ index: false, follow: true }`; a staging build
    // is wholesale `{ index: false, follow: false }`. Assert the exact contract
    // rather than a bare `toContain('follow')`, which 'nofollow' would satisfy.
    if (STAGING) expect(robots).toContain('nofollow')
    else {
      expect(robots).toContain('follow')
      expect(robots).not.toContain('nofollow')
    }
  })

  test('sitemap lists every public page and nothing private', async ({ request }) => {
    const res = await request.get('/sitemap.xml')
    expect(res.status()).toBe(200)
    const xml = await res.text()

    // Each path must appear as a real <loc> ENTRY whose pathname is that path.
    // (Substring matching is vacuous here: the plan's own
    // `p.replace(/\/$/, '') || '/'` reduces the home entry to "the sitemap
    // contains a slash" — true of every URL in the document.)
    const locPaths = [...xml.matchAll(/<loc>\s*([^<\s]+?)\s*<\/loc>/g)].map(
      (m) => new URL(m[1]).pathname,
    )
    for (const p of PATHS) {
      expect(locPaths, `sitemap has a <loc> for ${p}`).toContain(p)
    }
    expect(xml).not.toContain('/admin')
    expect(xml).not.toContain('/tim-kiem')
  })

  test('robots.txt matches the build contract', async ({ request }) => {
    const res = await request.get('/robots.txt')
    expect(res.status()).toBe(200)
    const body = await res.text()
    if (STAGING) {
      expect(body).toContain('Disallow: /')
    } else {
      expect(body).toContain('Allow: /api/media/')
      expect(body).toContain('Disallow: /api/')
      expect(body).toContain('Sitemap:')
    }
  })
})
