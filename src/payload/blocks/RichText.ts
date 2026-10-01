import type { Block } from 'payload'

export const RichText: Block = {
  slug: 'richText',
  labels: { singular: 'Đoạn văn bản', plural: 'Đoạn văn bản' },
  fields: [{ name: 'body', type: 'richText', label: 'Nội dung', required: true }],
}
