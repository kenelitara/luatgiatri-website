import { expect, test } from '@playwright/test'

// The 9 preserved URLs + home + news index (spec §2.5, §6.7)
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
]

test.describe('heading discipline (spec §6.4)', () => {
  for (const path of PATHS) {
    test(`${path} — 200, exactly one <h1>, no skipped levels`, async ({ page }) => {
      const res = await page.goto(path)
      expect(res?.status()).toBe(200)

      const h1Count = await page.locator('h1').count()
      expect(h1Count, `${path} must have exactly one <h1>`).toBe(1)

      // h1 must be the first heading on the page
      const firstHeadingLevel = await page.evaluate(() => {
        const first = document.querySelector('h1, h2, h3, h4, h5, h6')
        return first ? Number(first.tagName[1]) : 0
      })
      expect(firstHeadingLevel).toBe(1)

      // no skipped levels anywhere in the document order
      const skips = await page.evaluate(() => {
        const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
        const skips: string[] = []
        let prev = 0
        for (const h of headings) {
          const level = Number(h.tagName[1])
          if (prev > 0 && level > prev + 1) skips.push(`${prev}→${level} at "${h.textContent?.slice(0, 40)}"`)
          prev = level
        }
        return skips
      })
      expect(skips, `skipped heading levels on ${path}`).toEqual([])
    })
  }

  test('home <title> names the brand (spec §6.9)', async ({ page }) => {
    await page.goto('/')
    // the brand is auto-appended to the title (2026-10-01: the client chose a
    // shorter H1, so home is no longer the special case that carried it)
    const title = await page.title()
    expect(title).toContain('Luật Gia Trí')
    // bonus: the H1 no longer needs to repeat it — it carries the keyword copy
    const h1 = await page.locator('h1').first().textContent()
    expect(h1).not.toContain('Luật Gia Trí')
  })
})