import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  FOUND_TTL_MS,
  MISS_TTL_MS,
  expectedFields,
  industriesTitleCount,
  isCacheFresh,
  labelledValue,
  missingExpectedFields,
  parseIndustries,
  parseTaxRecord,
  recordBlock,
  taxSourceUrl,
} from './tax-lookup-parse'

// SAVED copies of the real pages — the live source is NEVER contacted from a test.
const read = (f: string) => readFileSync(join(process.cwd(), 'tests', 'fixtures', f), 'utf8')
const ENTERPRISE = read('dailychukyso-mst-0319122355.html')
const HOUSEHOLD = read('dailychukyso-mst-060091003294.html')
// A company with a large registered-industry list (35 items).
const BIG = read('dailychukyso-mst-0319461598.html')
const strip = (h: string) =>
  h.replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '')

const EXPECTED_ENTERPRISE = {
  mst: '0319122355',
  name: 'CÔNG TY TNHH THƯƠNG MẠI CÔNG NGHỆ HÀ NHI',
  englishName: 'HA NHI TECHNOLOGY TRADING COMPANY LIMITED',
  address: '54/16 Đường Số 2, Phường Bình Tân, TP Hồ Chí Minh, Việt Nam',
  representative: 'TRẦN LƯƠNG KHÁNH THY',
  sector: 'Bán buôn đồ dùng khác cho gia đình',
  industries: null, // this record has no industries section
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
      sector: null, // households have no "Ngành nghề chính" row
      industries: null, // households have no "industries-list" section
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

describe('sector ("Lĩnh vực chính") — record-region provenance, not the FAQ prose', () => {
  it('enterprise fixture yields the sector from the record region', () => {
    expect(parseTaxRecord(ENTERPRISE, '0319122355')?.sector).toBe('Bán buôn đồ dùng khác cho gia đình')
  })

  it('household fixture yields null (no such row)', () => {
    expect(parseTaxRecord(HOUSEHOLD, '060091003294')?.sector).toBeNull()
  })

  it('REGRESSION: the FAQPage prose is NOT the source, even though the value coincides', () => {
    // The raw page DOES contain the phrase in marketing copy…
    expect(ENTERPRISE).toContain('Ngành nghề kinh doanh chính của công ty là:')
    // …but the parser reads the record region, so it cannot be the source.
    expect(parseTaxRecord(ENTERPRISE, '0319122355')?.sector).toBe('Bán buôn đồ dùng khác cho gia đình')
  })

  // A page whose FAQ names a sector the record itself does NOT have. The values
  // are deliberately DIFFERENT, so a document-wide match would return the FAQ
  // string and this test would fail.
  const FAQ_VALUE = 'FAQ-MARKETING-VALUE'
  const SECTOR_PROVENANCE = `
    <html><body>
      <div class="card-info-grid">
        <div class="info-item"><span class="info-label">🏭 Ngành nghề chính</span><span class="info-value copyable">Bán buôn đồ dùng khác cho gia đình</span></div>
      </div>
      <div class="invoice-section"><div class="invoice-table">
        <div class="invoice-row"><span class="invoice-label">Tên công ty</span><span class="invoice-value">CÔNG TY ABC</span></div>
        <div class="invoice-row"><span class="invoice-label">Mã số thuế</span><span class="invoice-value">0319122355</span></div>
      </div></div>
      <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Lĩnh vực chính?","acceptedAnswer":{"@type":"Answer","text":"Ngành nghề doanh nghiệp chính của công ty là: ${FAQ_VALUE}."}}]}]}</script>
    </body></html>`

  it('returns the RECORD value, never the FAQ value (provenance)', () => {
    expect(SECTOR_PROVENANCE).toContain(FAQ_VALUE) // the trap is present in the page
    const rec = parseTaxRecord(SECTOR_PROVENANCE, '0319122355')
    expect(rec?.sector).toBe('Bán buôn đồ dùng khác cho gia đình')
    expect(rec?.sector).not.toBe(FAQ_VALUE)
  })

  it('a FAQ-only sector mention yields null (no record row to read)', () => {
    // Rename the RECORD label so it no longer matches, leaving the FAQ prose
    // (which still says "Ngành nghề") as the ONLY mention in the page.
    const faqOnly = SECTOR_PROVENANCE.replace('🏭 Ngành nghề chính', '🏭 Lĩnh vực hoạt động')
    expect(faqOnly).toContain(FAQ_VALUE) // the FAQ prose is still there…
    expect(faqOnly).toContain('Ngành nghề') // …and still says "Ngành nghề"
    expect(parseTaxRecord(faqOnly, '0319122355')?.sector).toBeNull() // …but is not parsed
  })
})

describe('industries ("Ngành nghề kinh doanh") — its own record section', () => {
  const rec = parseTaxRecord(BIG, '0319461598')

  it('parses exactly 35 items from the industries-list container', () => {
    expect(rec?.industries).toHaveLength(35)
  })

  it('first and last entries match the source order', () => {
    expect(rec?.industries?.[0]).toEqual({ code: '1075', name: 'Sản xuất món ăn, thức ăn chế biến sẵn' })
    expect(rec?.industries?.[34]?.code).toBe('9011')
    expect(rec?.industries?.[34]?.name).toMatch(/^Hoạt động sáng tác văn học và sáng tác âm nhạc/)
  })

  it('cross-check: the item count matches the section title count', () => {
    expect(industriesTitleCount(BIG)).toBe(35)
    expect(rec?.industries?.length).toBe(industriesTitleCount(BIG))
  })

  it('keeps long names with parenthetical qualifiers verbatim (no truncation)', () => {
    const last = rec?.industries?.[34]?.name ?? ''
    expect(last.length).toBeGreaterThan(100)
    expect(last).toContain('(trừ kinh doanh vũ trường')
  })

  it('the main sector is a SEPARATE single value (7310 - Quảng cáo), not the list', () => {
    expect(rec?.sector).toBe('7310 - Quảng cáo')
    expect(rec?.industries?.[0]?.code).not.toBe('7310')
  })

  it('REGRESSION: the summary prose is NOT the source', () => {
    // The page's intro paragraph says "Ngành nghề kinh doanh chính là 7310 - quảng cáo"…
    expect(BIG).toContain('Ngành nghề kinh doanh chính là')
    // …but the list comes from the container, so it starts at 1075, not 7310.
    expect(parseIndustries(BIG)?.[0]?.code).toBe('1075')
    expect(parseIndustries(BIG)).toHaveLength(35)
  })

  it('a page with prose but NO industries-list yields null', () => {
    const proseOnly = `
      <html><body>
        <div class="card-info-grid">
          <div class="info-item"><span class="info-label">🏭 Ngành nghề chính</span><span class="info-value">7310 - Quảng cáo</span></div>
        </div>
        <div class="invoice-section"><div class="invoice-table">
          <div class="invoice-row"><span class="invoice-label">Tên công ty</span><span class="invoice-value">CÔNG TY ABC</span></div>
          <div class="invoice-row"><span class="invoice-label">Mã số thuế</span><span class="invoice-value">0319461598</span></div>
        </div></div>
        <p>Ngành nghề kinh doanh chính là <strong>7310 - quảng cáo</strong>.</p>
      </body></html>`
    expect(proseOnly).toContain('Ngành nghề kinh doanh chính là')
    expect(parseTaxRecord(proseOnly, '0319461598')?.industries).toBeNull()
  })

  it('the two other fixtures have no industries section', () => {
    expect(parseTaxRecord(ENTERPRISE, '0319122355')?.industries).toBeNull()
    expect(parseTaxRecord(HOUSEHOLD, '060091003294')?.industries).toBeNull()
    expect(parseIndustries(ENTERPRISE)).toBeNull()
    expect(parseIndustries(HOUSEHOLD)).toBeNull()
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
