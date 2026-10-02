import { describe, expect, it } from 'vitest'
import { hashIp, isRateLimited, LEAD_RATE_LIMIT, TAX_LOOKUP_RATE_LIMIT } from './rate-limit'

describe('isRateLimited (spec §8)', () => {
  it('allows submissions up to max, then blocks', async () => {
    const cfg = { windowMinutes: 10, max: 3 }
    for (let count = 0; count < cfg.max; count++) {
      expect(await isRateLimited(async () => count, cfg)).toBe(false)
    }
    expect(await isRateLimited(async () => cfg.max, cfg)).toBe(true)
    expect(await isRateLimited(async () => cfg.max + 5, cfg)).toBe(true)
  })

  it('defaults to the shared lead config (5 per 10 minutes)', () => {
    expect(LEAD_RATE_LIMIT).toEqual({ windowMinutes: 10, max: 5 })
  })
})

describe('tax-code lookup limit (one visitor cannot drive bulk lookups)', () => {
  it('is 5 source fetches per 10 minutes per hashed IP', () => {
    expect(TAX_LOOKUP_RATE_LIMIT).toEqual({ windowMinutes: 10, max: 5 })
  })

  it('trips at the 6th lookup in the window', async () => {
    for (let count = 0; count < TAX_LOOKUP_RATE_LIMIT.max; count++) {
      expect(await isRateLimited(async () => count, TAX_LOOKUP_RATE_LIMIT)).toBe(false)
    }
    expect(await isRateLimited(async () => TAX_LOOKUP_RATE_LIMIT.max, TAX_LOOKUP_RATE_LIMIT)).toBe(true)
  })
})

describe('hashIp (Nghị định 13 — raw IPs are never stored)', () => {
  const ip = '203.0.113.42'

  it('is deterministic for the same salt + ip', async () => {
    expect(await hashIp(ip, 'salt-a')).toBe(await hashIp(ip, 'salt-a'))
  })

  it('differs across salts', async () => {
    expect(await hashIp(ip, 'salt-a')).not.toBe(await hashIp(ip, 'salt-b'))
  })

  it('emits 64 lowercase hex chars (SHA-256)', async () => {
    const hash = await hashIp(ip, 'salt-a')
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('never contains the raw IP', async () => {
    expect(await hashIp(ip, 'salt-a')).not.toContain(ip)
  })
})
