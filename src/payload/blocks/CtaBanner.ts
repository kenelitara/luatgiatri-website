import type { Block } from 'payload'

export const CtaBanner: Block = {
  slug: 'ctaBanner',
  labels: { singular: 'Khối CTA', plural: 'Khối CTA' },
  admin: {
    images: {
      thumbnail: { url: '/block-thumbnails/ctaBanner.svg', alt: 'Dải kêu gọi hành động nổi bật có tiêu đề và nút' },
    },
  },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Chú thích trên tiêu đề' },
    { name: 'heading', type: 'text', label: 'Tiêu đề', required: true },
    { name: 'body', type: 'textarea', label: 'Mô tả' },
    { name: 'ctaLabel', type: 'text', label: 'Nhãn nút', defaultValue: 'Liên hệ ngay' },
    { name: 'ctaHref', type: 'text', label: 'Liên kết', defaultValue: '/lien-he/' },
  ],
}
