import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { FOUND_TTL_MS, MISS_TTL_MS, isCacheFresh, parseTaxRecord, taxSourceUrl } from './tax-lookup-parse'

// A SAVED copy of the real page — the live source is NEVER contacted from a test.
const FIXTURE = readFileSync(
  join(process.cwd(), 'tests', 'fixtures', 'dailychukyso-mst-0319122355.html'),
  'utf8',
)

const EXPECTED = {
  mst: '0319122355',
  name: 'CÔNG TY TNHH THƯƠNG MẠI CÔNG NGHỆ HÀ NHI',
  englishName: 'HA NHI TECHNOLOGY TRADING COMPANY LIMITED',
  address: '54/16 Đường Số 2, Phường Bình Tân, TP Hồ Chí Minh, Việt Nam',
  representative: 'TRẦN LƯƠNG KHÁNH THY',
}

describe('parseTaxRecord — against the saved real page', () => {
  it('extracts every field from the JSON-LD graph', () => {
    expect(parseTaxRecord(FIXTURE, '0319122355')).toEqual(EXPECTED)
  })

  it('refuses a page that does not describe the requested code', () => {
    // The site's own Organization node is not the company when the code differs.
    expect(parseTaxRecord(FIXTURE, '9999999999')).toBeNull()
  })

  it('falls back to the labelled invoice rows when the JSON-LD is gone', () => {
    const stripped = FIXTURE.replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '')
    const rec = parseTaxRecord(stripped, '0319122355')
    expect(rec?.name).toBe(EXPECTED.name)
    expect(rec?.address).toBe(EXPECTED.address)
    expect(rec?.representative).toBe(EXPECTED.representative)
    // the English name lives only in the JSON-LD graph
    expect(rec?.englishName).toBeNull()
  })

  it('returns null on empty / junk / a page the parser no longer recognises', () => {
    expect(parseTaxRecord('', '0319122355')).toBeNull()
    expect(parseTaxRecord('<html><body><p>hello</p></body></html>', '0319122355')).toBeNull()
    // a "theme changed" page: the old labels are gone
    expect(parseTaxRecord('<div class="x">Tên: Công ty ABC</div>', '0319122355')).toBeNull()
  })

  it('survives a malformed JSON-LD block and still uses the labels', () => {
    const broken = FIXTURE.replace(
      /(<script[^>]*type=["']application\/ld\+json["'][^>]*>)[\s\S]*?(<\/script>)/i,
      '$1{not json$2',
    )
    expect(parseTaxRecord(broken, '0319122355')?.name).toBe(EXPECTED.name)
  })
})

describe('taxSourceUrl', () => {
  it('builds the canonical source URL', () => {
    expect(taxSourceUrl('0319122355')).toBe('https://dailychukyso.com.vn/mst/0319122355')
  })
})

describe('isCacheFresh (TTL)', () => {
  const now = new Date('2026-10-02T00:00:00Z')
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString()

  it('serves a found record for 30 days, then refreshes', () => {
    expect(isCacheFresh(ago(FOUND_TTL_MS - 1000), true, now)).toBe(true)
    expect(isCacheFresh(ago(FOUND_TTL_MS + 1000), true, now)).toBe(false)
  })

  it('re-checks a negative result much sooner (24 h)', () => {
    expect(isCacheFresh(ago(MISS_TTL_MS - 1000), false, now)).toBe(true)
    expect(isCacheFresh(ago(MISS_TTL_MS + 1000), false, now)).toBe(false)
  })

  it('treats a missing/invalid timestamp as stale', () => {
    expect(isCacheFresh(null, true, now)).toBe(false)
    expect(isCacheFresh('not-a-date', true, now)).toBe(false)
  })
})
