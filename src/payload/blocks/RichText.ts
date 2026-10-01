import type { Block } from 'payload'

export const RichText: Block = {
  slug: 'richText',
  labels: { singular: 'Đoạn văn bản', plural: 'Đoạn văn bản' },
  admin: {
    images: {
      thumbnail: { url: '/block-thumbnails/richText.svg', alt: 'Khối văn bản với tiêu đề và các đoạn nội dung' },
    },
  },
  fields: [{ name: 'body', type: 'richText', label: 'Nội dung', required: true }],
}
