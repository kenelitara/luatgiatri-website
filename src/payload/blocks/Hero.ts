import type { Block } from 'payload'

export const Hero: Block = {
  slug: 'hero',
  labels: { singular: 'Khối hero', plural: 'Khối hero' },
  fields: [
    { name: 'image', type: 'upload', label: 'Ảnh nền', relationTo: 'media', required: true },
    { name: 'headline', type: 'text', label: 'Tiêu đề lớn', required: true },
    { name: 'subheadline', type: 'text', label: 'Mô tả ngắn' },
    { name: 'ctaLabel', type: 'text', label: 'Nhãn nút' },
    { name: 'ctaHref', type: 'text', label: 'Liên kết nút' },
  ],
}
