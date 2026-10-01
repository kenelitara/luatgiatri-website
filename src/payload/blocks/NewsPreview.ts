import type { Block } from 'payload'

export const NewsPreview: Block = {
  slug: 'newsPreview',
  labels: { singular: 'Tin tức mới nhất', plural: 'Tin tức mới nhất' },
  fields: [
    { name: 'heading', type: 'text', label: 'Tiêu đề', defaultValue: 'Tin tức & Sự kiện' },
    { name: 'ctaHref', type: 'text', label: 'Liên kết xem tất cả', defaultValue: '/tin-tuc/' },
  ],
}
