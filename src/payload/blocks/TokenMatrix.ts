import type { Block } from 'payload'

export const TokenMatrix: Block = {
  slug: 'tokenMatrix',
  labels: { singular: 'Ma trận chữ ký số', plural: 'Ma trận chữ ký số' },
  admin: {
    images: {
      thumbnail: { url: '/block-thumbnails/tokenMatrix.svg', alt: 'Bảng ma trận chữ ký số nhiều cột phí và cột tổng' },
    },
  },
  fields: [
    { name: 'heading', type: 'text', label: 'Tiêu đề', required: true },
    {
      name: 'sections',
      type: 'array',
      label: 'Nhóm sản phẩm',
      labels: { singular: 'Nhóm sản phẩm', plural: 'Nhóm sản phẩm' },
      required: true,
      fields: [
        { name: 'title', type: 'text', label: 'Tên nhóm (h3 trên site cũ)', required: true },
        {
          name: 'columns',
          type: 'array',
          label: 'Cột',
          labels: { singular: 'Cột', plural: 'Cột' },
          required: true,
          fields: [{ name: 'label', type: 'text', label: 'Nhãn cột', required: true }],
        },
        {
          name: 'rows',
          type: 'array',
          label: 'Hàng',
          labels: { singular: 'Dòng', plural: 'Dòng' },
          required: true,
          fields: [
            {
              name: 'cells',
              type: 'array',
              label: 'Ô',
              labels: { singular: 'Ô', plural: 'Ô' },
              required: true,
              fields: [{ name: 'value', type: 'text', label: 'Giá trị', required: true }],
            },
          ],
        },
      ],
    },
    { name: 'note', type: 'textarea', label: 'Ghi chú' },
  ],
}