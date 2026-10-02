import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  FOUND_TTL_MS,
  MISS_TTL_MS,
  expectedFields,
  isCacheFresh,
  labelledValue,
  missingExpectedFields,
  parseTaxRecord,
  recordBlock,
  taxSourceUrl,
} from './tax-lookup-parse'

// SAVED copies of the real pages — the live source is NEVER contacted from a test.
const read = (f: string) => readFileSync(join(process.cwd(), 'tests', 'fixtures', f), 'utf8')
const ENTERPRISE = read('dailychukyso-mst-0319122355.html')
const HOUSEHOLD = read('dailychukyso-mst-060091003294.html')
const strip = (h: string) =>
  h.replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '')

const EXPECTED_ENTERPRISE = {
  mst: '0319122355',
  name: 'CÔNG TY TNHH THƯƠNG MẠI CÔNG NGHỆ HÀ NHI',
  englishName: 'HA NHI TECHNOLOGY TRADING COMPANY LIMITED',
  address: '54/16 Đường Số 2, Phường Bình Tân, TP Hồ Chí Minh, Việt Nam',
  representative: 'TRẦN LƯƠNG KHÁNH THY',
}

describe('parseTaxRecord — enterprise fixture (10-digit code)', () => {
  it('extracts every field from the JSON-LD graph', () => {
    expect(parseTaxRecord(ENTERPRISE, '0319122355')).toEqual(EXPECTED_ENTERPRISE)
  })

  it('refuses a page that does not describe the requested code', () => {
    expect(parseTaxRecord(ENTERPRISE, '9999999999')).toBeNull()
  })

  it('falls back to the labelled invoice rows when the JSON-LD is gone', () => {
    const rec = parseTaxRecord(strip(ENTERPRISE), '0319122355')
    expect(rec?.name).toBe(EXPECTED_ENTERPRISE.name)
    expect(rec?.address).toBe(EXPECTED_ENTERPRISE.address)
    expect(rec?.representative).toBe(EXPECTED_ENTERPRISE.representative)
    expect(rec?.englishName).toBeNull() // English name is JSON-LD-only
  })

  it('survives a malformed JSON-LD block and still uses the labels', () => {
    const broken = ENTERPRISE.replace(
      /(<script[^>]*type=["']application\/ld\+json["'][^>]*>)[\s\S]*?(<\/script>)/i,
      '$1{not json$2',
    )
    expect(parseTaxRecord(broken, '0319122355')?.name).toBe(EXPECTED_ENTERPRISE.name)
  })
})

describe('parseTaxRecord — business-household fixture (12-digit code)', () => {
  const rec = parseTaxRecord(HOUSEHOLD, '060091003294')

  it('reads the household record (a legitimate subset schema)', () => {
    expect(rec).toEqual({
      mst: '060091003294',
      name: 'HỘ KINH DOANH ELITARA TECH',
      englishName: null, // households have no alternateName
      address: 'LKB 36, Khu nhà ở U&I An Phú, đường An Phú 18, Khu phố 1B, Phường An Phú, TP Hồ Chí Minh',
      representative: null, // households have no founder
    })
  })

  it('REGRESSION: never yields the marketing checkmark "✓" as the representative', () => {
    // The page's feature checklist reads "✓ Người đại diện pháp luật"; a
    // whole-document label scan stores "✓" as the legal representative. The
    // record-anchored parser must yield null (and the row is not rendered).
    expect(rec?.representative).toBeNull()
    expect(JSON.stringify(rec)).not.toContain('✓')
  })

  it('also yields null for the representative when the JSON-LD is stripped', () => {
    expect(parseTaxRecord(strip(HOUSEHOLD), '060091003294')?.representative).toBeNull()
  })
})

describe('record-region anchoring (the structural fix)', () => {
  // A page whose ONLY mention of the representative is a label-classed checklist
  // entry carrying a checkmark — the exact shape a looser matcher would store.
  const TRAP = `
    <html><body>
      <div class="card-info-grid">
        <div class="info-item"><span class="info-label">📍 Địa chỉ</span><span class="info-value copyable">12 Nguyễn Huệ, Q.1</span></div>
      </div>
      <div class="invoice-section"><div class="invoice-table">
        <div class="invoice-row"><span class="invoice-label">Tên công ty</span><span class="invoice-value">CÔNG TY ABC</span></div>
        <div class="invoice-row"><span class="invoice-label">Mã số thuế</span><span class="invoice-value">0319122355</span></div>
      </div></div>
      <div class="checklist">
        <div class="info-item"><span class="info-label">Người đại diện pháp luật</span><span class="info-value">✓</span></div>
      </div>
    </body></html>`

  it('a whole-document label scan WOULD pick up the checkmark (the hazard)', () => {
    expect(labelledValue(TRAP, 'Người đại diện')).toBe('✓')
  })

  it('but the parser reads only the record region → null, never "✓"', () => {
    const rec = parseTaxRecord(TRAP, '0319122355')
    expect(rec?.name).toBe('CÔNG TY ABC')
    expect(rec?.address).toBe('12 Nguyễn Huệ, Q.1')
    expect(rec?.representative).toBeNull()
  })

  it('treats a page with no record region as unrecognised (no whole-doc fallback)', () => {
    const noRegion = TRAP.replace(/class="card-info-grid"/, 'class="x"').replace(
      /class="invoice-section"/,
      'class="y"',
    )
    // the checkmark checklist is still present, but there is no record to anchor to
    expect(parseTaxRecord(noRegion, '0319122355')).toBeNull()
  })

  it('recordBlock isolates the container and returns null when it is absent', () => {
    expect(recordBlock(TRAP, 'invoice-section')).toContain('CÔNG TY ABC')
    expect(recordBlock(TRAP, 'invoice-section')).not.toContain('✓')
    expect(recordBlock(TRAP, 'does-not-exist')).toBeNull()
  })
})

describe('missingExpectedFields — a subset schema is not a "partial record"', () => {
  it('a household is complete without an English name or a representative', () => {
    const rec = parseTaxRecord(HOUSEHOLD, '060091003294')!
    expect(missingExpectedFields(rec)).toEqual([])
  })

  it('an enterprise missing its representative IS partial', () => {
    const rec = parseTaxRecord(ENTERPRISE, '0319122355')!
    expect(missingExpectedFields(rec)).toEqual([]) // the real record is complete
    expect(missingExpectedFields({ ...rec, representative: null })).toEqual(['representative'])
  })

  it('a missing address is always a partial record', () => {
    const rec = parseTaxRecord(ENTERPRISE, '0319122355')!
    expect(missingExpectedFields({ ...rec, address: null })).toEqual(['address'])
  })

  it('branch codes follow their base entity type', () => {
    expect(expectedFields('060091003294-001')).toEqual(['name', 'address'])
    expect(expectedFields('0319122355-001')).toEqual(['name', 'address', 'representative'])
  })
})

describe('parseTaxRecord — junk input', () => {
  it('returns null on empty / junk', () => {
    expect(parseTaxRecord('', '0319122355')).toBeNull()
    expect(parseTaxRecord('<html><body><p>hello</p></body></html>', '0319122355')).toBeNull()
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
