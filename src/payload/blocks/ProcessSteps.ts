import type { Block } from 'payload'

export const ProcessSteps: Block = {
  slug: 'processSteps',
  labels: { singular: 'Quy trình các bước', plural: 'Quy trình các bước' },
  fields: [
    { name: 'heading', type: 'text', label: 'Tiêu đề' },
    {
      name: 'steps',
      type: 'array',
      label: 'Bước',
      required: true,
      fields: [
        { name: 'title', type: 'text', label: 'Tên bước', required: true },
        { name: 'body', type: 'textarea', label: 'Mô tả', required: true },
      ],
    },
  ],
}
