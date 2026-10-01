'use server'

import { headers } from 'next/headers'
import { getPayloadClient } from '@/lib/getPayload'
import { CONSENT_VERSION, hasContactMethod, leadSchema } from '@/lib/lead-schema'
import { hashIp, isRateLimited, LEAD_RATE_LIMIT } from '@/lib/rate-limit'

export type LeadActionResult = { ok: true } | { ok: false; error: string }

/**
 * The ONLY writer of Leads (spec §8): the collection's access.create is
 * `() => false` for every caller, so REST/GraphQL can never be scripted to
 * spam it — this action writes through the Local API with overrideAccess.
 */
export async function submitLead(formData: FormData): Promise<LeadActionResult> {
  const raw = Object.fromEntries(formData.entries())
  const parsed = leadSchema.safeParse({ ...raw, consent: raw.consent === 'on' })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' }
  }
  const input = parsed.data
  if (!hasContactMethod(input)) {
    return { ok: false, error: 'Vui lòng để lại số điện thoại hoặc email để chúng tôi liên hệ' }
  }

  const h = await headers()
  const ip = (h.get('x-forwarded-for')?.split(',')[0] ?? h.get('x-real-ip') ?? '0.0.0.0').trim()
  const ipHash = await hashIp(ip, process.env.IP_HASH_SALT ?? 'dev-salt')

  const payload = await getPayloadClient()
  const windowStart = new Date(Date.now() - LEAD_RATE_LIMIT.windowMinutes * 60_000).toISOString()

  const limited = await isRateLimited(
    async () =>
      (
        await payload.count({
          collection: 'leads',
          overrideAccess: true,
          where: {
            and: [
              { 'compliance.ipHash': { equals: ipHash } },
              { submittedAt: { greater_than: windowStart } },
            ],
          },
        })
      ).totalDocs,
  )
  if (limited)
    return { ok: false, error: 'Bạn đã gửi quá nhiều lần. Vui lòng thử lại sau ít phút.' }

  await payload.create({
    collection: 'leads',
    overrideAccess: true,
    data: {
      name: input.name,
      phone: input.phone || undefined,
      email: input.email || undefined,
      subject: input.subject || undefined,
      message: input.message || undefined,
      attribution: {
        sourcePage: input.sourcePage || undefined,
        sourceUrl: input.sourceUrl || undefined,
        referrer: input.referrer || undefined,
        utmSource: input.utmSource || undefined,
        utmMedium: input.utmMedium || undefined,
        utmCampaign: input.utmCampaign || undefined,
      },
      compliance: {
        consentedAt: new Date().toISOString(),
        consentVersion: CONSENT_VERSION,
        ipHash,
      },
      status: 'new',
      submittedAt: new Date().toISOString(),
    },
  })
  return { ok: true }
}
