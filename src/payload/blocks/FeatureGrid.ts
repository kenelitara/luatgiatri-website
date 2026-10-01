import type { Block } from 'payload'

export const FeatureGrid: Block = {
  slug: 'featureGrid',
  labels: { singular: 'Lưới giá trị cốt lõi', plural: 'Lưới giá trị cốt lõi' },
  fields: [
    { name: 'heading', type: 'text', label: 'Tiêu đề khối' },
    {
      name: 'items',
      type: 'array',
      label: 'Mục',
      required: true,
      fields: [
        { name: 'title', type: 'text', label: 'Tiêu đề', required: true },
        { name: 'body', type: 'textarea', label: 'Mô tả', required: true },
      ],
    },
  ],
}
