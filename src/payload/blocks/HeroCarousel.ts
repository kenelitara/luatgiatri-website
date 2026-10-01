import type { Block } from 'payload'

export const HeroCarousel: Block = {
  slug: 'heroCarousel',
  labels: { singular: 'Hero nhiều slide', plural: 'Hero nhiều slide' },
  fields: [
    {
      name: 'slides',
      type: 'array',
      label: 'Slide',
      required: true,
      minRows: 1,
      fields: [
        { name: 'image', type: 'upload', label: 'Ảnh', relationTo: 'media', required: true },
        { name: 'headline', type: 'text', label: 'Tiêu đề', required: true },
        { name: 'subheadline', type: 'text', label: 'Mô tả' },
        { name: 'ctaLabel', type: 'text', label: 'Nhãn nút' },
        { name: 'ctaHref', type: 'text', label: 'Liên kết nút' },
      ],
    },
    { name: 'intervalMs', type: 'number', label: 'Tự chuyển sau (ms)', defaultValue: 6000 },
  ],
}