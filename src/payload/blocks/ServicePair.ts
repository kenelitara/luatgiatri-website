import type { Block } from 'payload'

export const ServicePair: Block = {
  slug: 'servicePair',
  labels: { singular: 'Dịch vụ 2 cột (ảnh + chữ)', plural: 'Dịch vụ 2 cột' },
  imageURL: '/block-thumbnails/servicePair.svg',
  imageAltText: 'Hai cột: ảnh bên cạnh đoạn mô tả dịch vụ và danh sách',
  fields: [
    { name: 'image', type: 'upload', label: 'Ảnh', relationTo: 'media', required: true },
    { name: 'heading', type: 'text', label: 'Tiêu đề', required: true },
    { name: 'body', type: 'richText', label: 'Mô tả', required: true },
    {
      name: 'bullets',
      type: 'array',
      label: 'Danh sách (dấu tích)',
      fields: [{ name: 'item', type: 'text', label: 'Mục', required: true }],
    },
    { name: 'reverse', type: 'checkbox', label: 'Ảnh bên phải', defaultValue: false },
    { name: 'ctaLabel', type: 'text', label: 'Nhãn nút' },
    { name: 'ctaHref', type: 'text', label: 'Liên kết nút' },
  ],
}
