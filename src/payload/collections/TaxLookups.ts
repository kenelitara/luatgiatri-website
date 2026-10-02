import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'

/**
 * Cache of on-demand tax-code lookups (mã số thuế) read from a third-party
 * public source. This collection is the whole reason the `/tra-cuu-ma-so-thue/`
 * feature is a good citizen: the source page is fetched ONCE per code and every
 * later visitor is served from here (spec: one fetch per code, TTL 30 days).
 *
 * Server-only writer — `access.create`/`update` are closed to the browser (the
 * same lock-out as Leads). The lookup module writes through the Local API with
 * `overrideAccess`.
 */
export const TaxLookups: CollectionConfig = {
  slug: 'tax-lookups',
  labels: { singular: 'Tra cứu mã số thuế', plural: 'Tra cứu mã số thuế' },
  admin: {
    useAsTitle: 'mst',
    defaultColumns: ['mst', 'outcome', 'name', 'fetchedAt'],
  },
  access: {
    read: isAdmin,
    create: () => false,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'mst',
      type: 'text',
      label: 'Mã số thuế',
      required: true,
      unique: true,
      admin: { description: 'Dạng chuẩn hoá: 10 chữ số, hoặc 10 chữ số + 3 chữ số của đơn vị trực thuộc.' },
    },
    {
      name: 'outcome',
      type: 'select',
      label: 'Kết quả',
      required: true,
      defaultValue: 'notfound',
      options: [
        { label: 'Có dữ liệu', value: 'found' },
        { label: 'Không tìm thấy', value: 'notfound' },
        { label: 'Không tải được nguồn', value: 'unavailable' },
        { label: 'Không phân tích được trang', value: 'parsed-empty' },
      ],
      admin: {
        description:
          'parsed-empty = nguồn trả 200 nhưng không đọc được bản ghi (dấu hiệu trang nguồn đổi cấu trúc).',
      },
    },
    { name: 'name', type: 'text', label: 'Tên doanh nghiệp' },
    { name: 'englishName', type: 'text', label: 'Tên giao dịch (tiếng Anh)' },
    { name: 'address', type: 'textarea', label: 'Địa chỉ' },
    { name: 'representative', type: 'text', label: 'Người đại diện pháp luật' },
    { name: 'fetchedAt', type: 'date', label: 'Thời điểm tra cứu', required: true },
    { name: 'source', type: 'text', label: 'Nguồn', required: true },
    {
      name: 'fetchedByIpHash',
      type: 'text',
      label: 'Băm IP (SHA-256 + muối)',
      admin: { description: 'Không lưu IP thô — dùng cho giới hạn tần suất.' },
    },
  ],
}
