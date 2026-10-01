import type { Block } from 'payload'

export const NewsPreview: Block = {
  slug: 'newsPreview',
  labels: { singular: 'Tin tức mới nhất', plural: 'Tin tức mới nhất' },
  imageURL: '/block-thumbnails/newsPreview.svg',
  imageAltText: 'Ba thẻ bài viết mới nhất và liên kết xem tất cả',
  fields: [
    { name: 'heading', type: 'text', label: 'Tiêu đề', defaultValue: 'Tin tức & Sự kiện' },
    { name: 'ctaHref', type: 'text', label: 'Liên kết xem tất cả', defaultValue: '/tin-tuc/' },
  ],
}
