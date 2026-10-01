import type { Block } from 'payload'

export const Faq: Block = {
  slug: 'faq',
  labels: { singular: 'Hỏi đáp (FAQ)', plural: 'Hỏi đáp (FAQ)' },
  imageURL: '/block-thumbnails/faq.svg',
  imageAltText: 'Danh sách câu hỏi thường gặp dạng accordion có mũi tên',
  fields: [
    { name: 'heading', type: 'text', label: 'Tiêu đề', defaultValue: 'Câu hỏi thường gặp' },
    {
      name: 'items',
      type: 'array',
      label: 'Câu hỏi',
      required: true,
      fields: [
        { name: 'question', type: 'text', label: 'Câu hỏi', required: true },
        { name: 'answer', type: 'richText', label: 'Câu trả lời', required: true },
      ],
    },
  ],
}
