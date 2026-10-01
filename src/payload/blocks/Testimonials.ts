import type { Block } from 'payload'

export const Testimonials: Block = {
  slug: 'testimonials',
  labels: { singular: 'Khách hàng nói gì', plural: 'Khách hàng nói gì' },
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: 'Tiêu đề',
      defaultValue: 'Khách Hàng Của Luật Gia Trí',
    },
    {
      name: 'items',
      type: 'array',
      label: 'Nhận xét',
      required: true,
      fields: [
        { name: 'quote', type: 'textarea', label: 'Lời nhận xét', required: true },
        { name: 'name', type: 'text', label: 'Tên', required: true },
        { name: 'role', type: 'text', label: 'Chức vụ/Đơn vị' },
      ],
    },
  ],
}
