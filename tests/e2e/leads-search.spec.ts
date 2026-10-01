import { expect, test } from '@playwright/test'

test.describe('search + leads (spec §10.3)', () => {
  test('diacritic-free query finds the accounting page', async ({ page }) => {
    await page.goto('/tim-kiem/?q=ke+toan')
    // Assert the RESULT link, not the header nav link ("Kế toán"). The result
    // link's accessible name is the result title (Pages.primaryHeading), so a
    // nav-only match cannot make this pass while search returns nothing.
    await expect(
      page.getByRole('link', { name: 'Dịch Vụ Kế Toán Doanh Nghiệp Tại TP.HCM' }),
    ).toBeVisible()
  })

  test('nonsense query shows the empty state', async ({ page }) => {
    await page.goto('/tim-kiem/?q=xyzzy-nothing')
    await expect(page.getByText('0 kết quả')).toBeVisible()
  })

  test.describe('lead form', () => {
    // Task 11 enforces a DB-backed throttle (spec §8): 5 submissions / 10 min /
    // hashed IP, hashed from x-forwarded-for (then x-real-ip, then '0.0.0.0').
    // A Playwright browser sends neither header, so EVERY run from this machine
    // looks like the same client and run #6 inside a 10-minute window is
    // correctly throttled — the success assertion would then fail for a reason
    // unrelated to the code under test. Each run presents its own synthetic
    // client IP instead: the throttle itself is untouched, the test just stops
    // sharing a rate-limit bucket with its own previous runs.
    const RUN_IP = ['10', ...Array.from({ length: 3 }, () => Math.floor(Math.random() * 256))].join(
      '.',
    )
    test.use({ extraHTTPHeaders: { 'x-forwarded-for': RUN_IP } })

    test('contact form submits and shows the success state', async ({ page }) => {
      await page.goto('/lien-he/')
      // Scope every interaction to the lead form (identified by its consent
      // checkbox). The header's SearchBox is ALSO a form with a
      // `button[type="submit"]` ("Tìm") and it precedes <main> in the DOM, so a
      // bare `button[type="submit"]` click (the plan's selector) hits the search
      // button and GETs /tim-kiem/ — the lead is never submitted.
      const form = page.locator('form:has(input[name="consent"])')
      await form.locator('input[name="name"]').fill('E2E Người Thử')
      await form.locator('input[name="phone"]').fill('0900000001')
      await form.locator('input[name="consent"]').check()
      await form.locator('button[type="submit"]').click()
      await expect(page.getByText('Cảm ơn bạn đã liên hệ.')).toBeVisible({ timeout: 15_000 })
    })
  })

  test('consent banner gates GA4', async ({ page }) => {
    // The id is DB-sourced (SiteSettings.ga4Id), so the gate procedure is:
    //   pnpm ga4:set G-TEST123  →  pnpm build  →  next start -p 3100  →  pnpm e2e
    //   →  pnpm ga4:clear
    // It MUST be in the database before `pnpm build`, because the banner's
    // presence is baked into the prerendered HTML and ISR only refreshes that
    // after ~60 s. The visible "Đồng ý" button is therefore itself evidence
    // that the seeded id reached the build — a run without the id fails here,
    // not silently passes.
    await page.goto('/')
    // fresh context per test → localStorage is empty → no prior consent
    expect(await page.locator('#ga4-script').count()).toBe(0)
    await page.getByRole('button', { name: 'Đồng ý' }).click()
    await expect(page.locator('#ga4-script')).toHaveCount(1)
  })
})
