import type { Block } from 'payload'

export const NewsPreview: Block = {
  slug: 'newsPreview',
  labels: { singular: 'Tin tức mới nhất', plural: 'Tin tức mới nhất' },
  admin: {
    images: {
      thumbnail: { url: '/block-thumbnails/newsPreview.svg', alt: 'Ba thẻ bài viết mới nhất và liên kết xem tất cả' },
    },
  },
  fields: [
    { name: 'heading', type: 'text', label: 'Tiêu đề', defaultValue: 'Tin tức & Sự kiện' },
    { name: 'ctaHref', type: 'text', label: 'Liên kết xem tất cả', defaultValue: '/tin-tuc/' },
  ],
}
