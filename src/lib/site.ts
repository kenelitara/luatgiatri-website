import { getPayloadClient } from '@/lib/getPayload'
import { DEFAULT_BRAND } from '@/lib/metadata'
import type { Navigation, SiteSetting } from '@/payload-types'

/**
 * M2 DB-at-build convention (AGENTS.md, Docker-stack section): a `docker build`
 * has no DB, so any Local API read that throws during prerender fails the whole
 * `next build`. These globals are read by the `(frontend)` layout and the chrome
 * components, so their fetchers carry the same try/catch fallbacks as
 * `getPage`/`getPost`. The fallbacks match the globals' configured defaults —
 * the baked HTML stays correct-ish and the first runtime revalidation (ISR)
 * heals it to the DB values.
 */
const SITE_SETTINGS_FALLBACK: SiteSetting = {
  id: 0,
  // DEFAULT_BRAND, not a re-typed literal: with no DB this fallback IS the
  // effective brand source — including for the `/og` cards.
  brandName: DEFAULT_BRAND,
  hotline: '0919088119',
  email: 'luatsu@luatgiatri.com',
  address: {
    street: '54/16 Đường số 2',
    district: 'Bình Tân',
    city: 'TP.HCM',
    country: 'VN',
  },
}

const NAVIGATION_FALLBACK: Navigation = { id: 0, headerItems: [] }

export async function getSiteSettings(): Promise<SiteSetting> {
  try {
    const payload = await getPayloadClient()
    return await payload.findGlobal({ slug: 'site-settings', depth: 1 })
  } catch {
    return SITE_SETTINGS_FALLBACK
  }
}

export async function getNavigation(): Promise<Navigation> {
  try {
    const payload = await getPayloadClient()
    return await payload.findGlobal({ slug: 'navigation', depth: 0 })
  } catch {
    return NAVIGATION_FALLBACK
  }
}

export function fullAddress(settings: Awaited<ReturnType<typeof getSiteSettings>>): string {
  const a = settings.address
  return [a?.street, a?.ward, a?.district, a?.city].filter(Boolean).join(', ')
}
