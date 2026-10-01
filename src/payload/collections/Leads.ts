import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'

// No public create: the M3 server action is the only writer, via the Local API
// with overrideAccess. Direct REST/GraphQL creation is closed off.
export const Leads: CollectionConfig = {
  slug: 'leads',
  labels: { singular: 'Liên hệ (lead)', plural: 'Hộp thư liên hệ' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'phone', 'status', 'submittedAt'] },
  access: {
    read: isAdmin,
    create: () => false,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'name', type: 'text', label: 'Họ tên', required: true },
    { name: 'email', type: 'email', label: 'Email' },
    { name: 'phone', type: 'text', label: 'Điện thoại' },
    { name: 'subject', type: 'text', label: 'Chủ đề' },
    { name: 'message', type: 'textarea', label: 'Nội dung' },
    {
      name: 'attribution',
      type: 'group',
      label: 'Nguồn gốc',
      fields: [
        { name: 'sourcePage', type: 'text', label: 'Trang gửi' },
        { name: 'sourceUrl', type: 'text', label: 'URL đầy đủ' },
        { name: 'referrer', type: 'text', label: 'Referrer' },
        { name: 'utmSource', type: 'text', label: 'utm_source' },
        { name: 'utmMedium', type: 'text', label: 'utm_medium' },
        { name: 'utmCampaign', type: 'text', label: 'utm_campaign' },
      ],
    },
    {
      name: 'compliance',
      type: 'group',
      label: 'Đồng ý xử lý dữ liệu (Nghị định 13)',
      fields: [
        { name: 'consentedAt', type: 'date', label: 'Thời điểm đồng ý', required: true },
        { name: 'consentVersion', type: 'text', label: 'Phiên bản văn bản đồng ý', required: true },
        { name: 'ipHash', type: 'text', label: 'Băm IP (SHA-256 + muối)', admin: { description: 'Không lưu IP thô' } },
      ],
    },
    {
      name: 'status',
      type: 'select',
      label: 'Trạng thái',
      defaultValue: 'new',
      options: [
        { label: 'Mới', value: 'new' },
        { label: 'Đã liên hệ', value: 'contacted' },
        { label: 'Đã đóng', value: 'closed' },
      ],
    },
    { name: 'internalNotes', type: 'textarea', label: 'Ghi chú nội bộ' },
    { name: 'submittedAt', type: 'date', label: 'Gửi lúc', required: true },
  ],
}