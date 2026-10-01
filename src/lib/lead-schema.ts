import { z } from 'zod'

/** spec §8: consent is mandatory; the version string is stored with each lead (Nghị định 13 record-keeping). */
export const CONSENT_VERSION = 'nd13-2026-10'

export const leadSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập họ tên').max(120),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  email: z.string().trim().email('Email không hợp lệ').optional().or(z.literal('')),
  subject: z.string().trim().max(200).optional().or(z.literal('')),
  message: z.string().trim().max(4000).optional().or(z.literal('')),
  consent: z.literal(true, { message: 'Cần đồng ý xử lý dữ liệu để gửi' }),
  /** honeypot — must stay empty (bots fill it). The message is never seen by a human. */
  website: z.string().max(0, 'Yêu cầu không hợp lệ').optional().or(z.literal('')),
  sourcePage: z.string().max(300).optional().or(z.literal('')),
  sourceUrl: z.string().max(500).optional().or(z.literal('')),
  referrer: z.string().max(500).optional().or(z.literal('')),
  utmSource: z.string().max(100).optional().or(z.literal('')),
  utmMedium: z.string().max(100).optional().or(z.literal('')),
  utmCampaign: z.string().max(100).optional().or(z.literal('')),
})

export type LeadInput = z.infer<typeof leadSchema>

/** A phone or an email must exist — a lead with neither is not actionable. */
export function hasContactMethod(input: Pick<LeadInput, 'phone' | 'email'>): boolean {
  return Boolean((input.phone && input.phone.length > 0) || (input.email && input.email.length > 0))
}
