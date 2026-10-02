import { describe, expect, it } from 'vitest'
import { isValidTaxCode, normalizeTaxCode } from './tax-code'

describe('normalizeTaxCode', () => {
  it('passes through a canonical 10-digit code', () => {
    expect(normalizeTaxCode('0319122355')).toBe('0319122355')
  })

  it('keeps the branch form 10+3', () => {
    expect(normalizeTaxCode('0319122355-001')).toBe('0319122355-001')
  })

  it('strips spaces and dots', () => {
    expect(normalizeTaxCode('031 912 2355')).toBe('0319122355')
    expect(normalizeTaxCode('031.912.2355')).toBe('0319122355')
    expect(normalizeTaxCode(' 0319122355 ')).toBe('0319122355')
  })

  it('normalises unicode dashes and stray separators', () => {
    expect(normalizeTaxCode('0319122355–001')).toBe('0319122355-001')
    expect(normalizeTaxCode('0319122355 - 001')).toBe('0319122355-001')
    expect(normalizeTaxCode('0319122355-')).toBe('0319122355')
  })

  it('turns a bare 13-digit run into the branch form', () => {
    expect(normalizeTaxCode('0319122355001')).toBe('0319122355-001')
  })

  it('does not invent validity — junk passes through untouched', () => {
    expect(normalizeTaxCode('abc')).toBe('abc')
    expect(normalizeTaxCode('1234567')).toBe('1234567')
    expect(normalizeTaxCode('')).toBe('')
    expect(normalizeTaxCode(undefined)).toBe('')
  })
})

describe('isValidTaxCode', () => {
  it('accepts 10 digits and 10+3', () => {
    expect(isValidTaxCode('0319122355')).toBe(true)
    expect(isValidTaxCode('0319122355-001')).toBe(true)
  })

  it('rejects everything else', () => {
    for (const bad of ['abc', '1234567', '031912235', '03191223550', '0319122355-01', '0319122355-0001', '', '0319122355-abc'])
      expect(isValidTaxCode(bad), bad).toBe(false)
  })
})
