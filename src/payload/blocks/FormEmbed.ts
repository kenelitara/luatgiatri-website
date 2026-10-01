import type { Block } from 'payload'

export const FormEmbed: Block = {
  slug: 'formEmbed',
  labels: { singular: 'Khối biểu mẫu liên hệ', plural: 'Khối biểu mẫu liên hệ' },
  imageURL: '/block-thumbnails/formEmbed.svg',
  imageAltText: 'Biểu mẫu liên hệ với các ô nhập và nút gửi',
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: 'Tiêu đề',
      required: true,
      defaultValue: 'Liên hệ với chúng tôi',
    },
    { name: 'intro', type: 'textarea', label: 'Mô tả' },
  ],
}
