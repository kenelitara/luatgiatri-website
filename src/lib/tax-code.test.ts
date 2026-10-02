import { describe, expect, it } from 'vitest'
import { isValidTaxCode, normalizeTaxCode } from './tax-code'

describe('normalizeTaxCode', () => {
  it('passes through a canonical 10-digit enterprise code', () => {
    expect(normalizeTaxCode('0319122355')).toBe('0319122355')
  })

  it('passes through a canonical 12-digit household code', () => {
    expect(normalizeTaxCode('060091003294')).toBe('060091003294')
  })

  it('keeps the branch form, for either base length', () => {
    expect(normalizeTaxCode('0319122355-001')).toBe('0319122355-001')
    expect(normalizeTaxCode('060091003294-001')).toBe('060091003294-001')
  })

  it('strips spaces and dots', () => {
    expect(normalizeTaxCode('031 912 2355')).toBe('0319122355')
    expect(normalizeTaxCode('031.912.2355')).toBe('0319122355')
    expect(normalizeTaxCode('060 091 003 294')).toBe('060091003294')
    expect(normalizeTaxCode(' 0319122355 ')).toBe('0319122355')
  })

  it('normalises unicode dashes and stray separators', () => {
    expect(normalizeTaxCode('0319122355–001')).toBe('0319122355-001')
    expect(normalizeTaxCode('0319122355 - 001')).toBe('0319122355-001')
    expect(normalizeTaxCode('0319122355-')).toBe('0319122355')
  })

  it('turns a bare 13-digit run into the enterprise branch form', () => {
    expect(normalizeTaxCode('0319122355001')).toBe('0319122355-001')
  })

  it('turns a bare 15-digit run into the household branch form', () => {
    expect(normalizeTaxCode('060091003294001')).toBe('060091003294-001')
  })

  it('does not invent validity — junk passes through untouched', () => {
    expect(normalizeTaxCode('abc')).toBe('abc')
    expect(normalizeTaxCode('1234567')).toBe('1234567')
    expect(normalizeTaxCode('')).toBe('')
    expect(normalizeTaxCode(undefined)).toBe('')
  })
})

describe('isValidTaxCode', () => {
  it('accepts 10 and 12 digits, each optionally with a -3 branch suffix', () => {
    expect(isValidTaxCode('0319122355')).toBe(true) // enterprise
    expect(isValidTaxCode('0319122355-001')).toBe(true) // enterprise branch
    expect(isValidTaxCode('060091003294')).toBe(true) // business household
    expect(isValidTaxCode('060091003294-001')).toBe(true) // household branch
  })

  it('rejects the wrong digit counts', () => {
    for (const bad of [
      '1234567', // 7
      '12345678', // 8
      '123456789', // 9
      '12345678901', // 11
      '1234567890123', // 13 (only the 10-3 split normalises; raw 13 is not valid)
      '12345678901234', // 14
      '123456789012345', // 15
      '', // empty
      'abc',
    ])
      expect(isValidTaxCode(bad), bad).toBe(false)
  })

  it('rejects malformed branch suffixes', () => {
    for (const bad of [
      '0319122355-0',
      '0319122355-01',
      '0319122355-0001',
      '0319122355-abc',
      '060091003294-01',
      '060091003294-0001',
      '0319122355001-001', // 16 digits before the suffix
      '-0319122355',
    ])
      expect(isValidTaxCode(bad), bad).toBe(false)
  })
})
