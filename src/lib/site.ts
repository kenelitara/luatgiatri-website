import { getPayloadClient } from '@/lib/getPayload'

export async function getSiteSettings() {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'site-settings', depth: 1 })
}

export async function getNavigation() {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'navigation', depth: 0 })
}

export function fullAddress(settings: Awaited<ReturnType<typeof getSiteSettings>>): string {
  const a = settings.address
  return [a?.street, a?.ward, a?.district, a?.city].filter(Boolean).join(', ')
}
