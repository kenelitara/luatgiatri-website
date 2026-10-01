import type { Block } from 'payload'

export const RichText: Block = {
  slug: 'richText',
  labels: { singular: 'Đoạn văn bản', plural: 'Đoạn văn bản' },
  imageURL: '/block-thumbnails/richText.svg',
  imageAltText: 'Khối văn bản với tiêu đề và các đoạn nội dung',
  fields: [{ name: 'body', type: 'richText', label: 'Nội dung', required: true }],
}
