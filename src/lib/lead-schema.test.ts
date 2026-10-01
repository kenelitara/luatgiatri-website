import { describe, expect, it } from 'vitest'
import { hasContactMethod, leadSchema } from './lead-schema'

describe('leadSchema (spec §8)', () => {
  it('accepts a minimal valid submission (name + consent)', () => {
    const parsed = leadSchema.safeParse({ name: 'Nguyễn Văn A', consent: true })
    expect(parsed.success).toBe(true)
  })

  it('rejects a blank name', () => {
    const parsed = leadSchema.safeParse({ name: '   ', consent: true })
    expect(parsed.success).toBe(false)
    expect(parsed.error?.issues[0]?.message).toBe('Vui lòng nhập họ tên')
  })

  it('rejects consent that is absent', () => {
    expect(leadSchema.safeParse({ name: 'Nguyễn Văn A' }).success).toBe(false)
  })

  it('rejects consent that is false', () => {
    const parsed = leadSchema.safeParse({ name: 'Nguyễn Văn A', consent: false })
    expect(parsed.success).toBe(false)
    expect(parsed.error?.issues[0]?.message).toBe('Cần đồng ý xử lý dữ liệu để gửi')
  })

  it('rejects a filled honeypot (bots fill it)', () => {
    const parsed = leadSchema.safeParse({
      name: 'Nguyễn Văn A',
      consent: true,
      website: 'https://spam.example',
    })
    expect(parsed.success).toBe(false)
  })

  it('rejects a malformed email but accepts an empty one', () => {
    const bad = leadSchema.safeParse({ name: 'A', consent: true, email: 'not-an-email' })
    expect(bad.success).toBe(false)
    expect(bad.error?.issues[0]?.message).toBe('Email không hợp lệ')
    expect(leadSchema.safeParse({ name: 'A', consent: true, email: '' }).success).toBe(true)
  })

  it('accepts empty optional strings (unfilled form fields)', () => {
    const parsed = leadSchema.safeParse({
      name: 'A',
      consent: true,
      phone: '',
      subject: '',
      message: '',
    })
    expect(parsed.success).toBe(true)
  })
})

describe('hasContactMethod (a lead with neither phone nor email is not actionable)', () => {
  it('is true when only a phone is present', () => {
    expect(hasContactMethod({ phone: '0919088119', email: '' })).toBe(true)
  })

  it('is true when only an email is present', () => {
    expect(hasContactMethod({ phone: '', email: 'a@b.com' })).toBe(true)
  })

  it('is false when both are empty or undefined', () => {
    expect(hasContactMethod({ phone: '', email: '' })).toBe(false)
    expect(hasContactMethod({})).toBe(false)
  })
})
