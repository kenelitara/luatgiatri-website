import { describe, expect, it } from 'vitest'
import { slugify } from './slugify'

describe('slugify — Vietnamese titles (real page inventory, spec §2.5)', () => {
  it('maps every diacritic (spec §6.7 character map)', () => {
    expect(slugify('Thành Lập Doanh Nghiệp Trọn Gói')).toBe('thanh-lap-doanh-nghiep-tron-goi')
    expect(slugify('Dịch Vụ Kế Toán')).toBe('dich-vu-ke-toan')
    expect(slugify('Hóa Đơn Điện Tử')).toBe('hoa-don-dien-tu')
    expect(slugify('Chữ Ký Số - Token')).toBe('chu-ky-so-token')
    expect(slugify('Dịch Vụ Liên Kết')).toBe('dich-vu-lien-ket')
    expect(slugify('Hỗ Trợ Doanh Nghiệp')).toBe('ho-tro-doanh-nghiep')
  })

  it('strips tone marks on every vowel', () => {
    expect(slugify('Luật Gia Trí')).toBe('luat-gia-tri')
    expect(slugify('Tổng đài hỗ trợ 24/7!')).toBe('tong-dai-ho-tro-24-7')
  })

  it('handles đ, Đ, and mixed case', () => {
    expect(slugify('đăng ký')).toBe('dang-ky')
    expect(slugify('ĐẠI PHÁP')).toBe('dai-phap')
  })

  it('collapses separators and trims edges', () => {
    expect(slugify('  --- Giới  Thiệu ---  ')).toBe('gioi-thieu')
    expect(slugify('Liên Hệ!')).toBe('lien-he')
  })

  it('does not mangle ASCII-only input', () => {
    expect(slugify('RSS Feed 2026')).toBe('rss-feed-2026')
  })
})
