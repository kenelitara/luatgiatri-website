import type { Block } from 'payload'

export const PricingTable: Block = {
  slug: 'pricingTable',
  labels: { singular: 'Bảng giá', plural: 'Bảng giá' },
  fields: [
    { name: 'heading', type: 'text', label: 'Tiêu đề', required: true },
    {
      name: 'columns',
      type: 'select',
      label: 'Cột',
      required: true,
      defaultValue: 'service-fee',
      options: [
        { label: 'Dịch vụ — Phí', value: 'service-fee' },
        { label: 'Dịch vụ — Hạn hạn mức — Phí', value: 'service-term-fee' },
      ],
      admin: { description: 'service-term-fee dùng cho ma trận chữ ký số (spec §5.5)' },
    },
    {
      name: 'groups',
      type: 'array',
      label: 'Nhóm hàng',
      fields: [
        { name: 'title', type: 'text', label: 'Tên nhóm' },
        {
          name: 'rows',
          type: 'array',
          label: 'Hàng',
          required: true,
          fields: [
            { name: 'service', type: 'text', label: 'Dịch vụ', required: true },
            { name: 'term', type: 'text', label: 'Hạn hạn mức (1 năm / 2 năm…)' },
            { name: 'fee', type: 'text', label: 'Phí', required: true },
          ],
        },
      ],
    },
    { name: 'note', type: 'textarea', label: 'Ghi chú' },
  ],
}
