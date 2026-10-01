import type { Block } from 'payload'

export const HeroCarousel: Block = {
  slug: 'heroCarousel',
  labels: { singular: 'Hero nhiều slide', plural: 'Hero nhiều slide' },
  fields: [
    {
      name: 'slides',
      type: 'array',
      label: 'Slide',
      required: true,
      minRows: 1,
      fields: [
        { name: 'image', type: 'upload', label: 'Ảnh', relationTo: 'media', required: true },
        { name: 'headline', type: 'text', label: 'Tiêu đề', required: true },
        { name: 'subheadline', type: 'text', label: 'Mô tả' },
        { name: 'ctaLabel', type: 'text', label: 'Nhãn nút' },
        { name: 'ctaHref', type: 'text', label: 'Liên kết nút' },
      ],
    },
    { name: 'intervalMs', type: 'number', label: 'Tự chuyển sau (ms)', defaultValue: 6000 },
    {
      name: 'showOverlay',
      type: 'checkbox',
      label: 'Phủ tiêu đề lên ảnh (chỉ khi ảnh KHÔNG đã có chữ)',
      defaultValue: false,
      admin: {
        description:
          'Banner cũ trên site đã chứa sẵn chữ trong ảnh — để tắt (mặc định) cho các banner đó, tránh chữ chồng chữ. Bật khi ảnh là ảnh nền trơn và cần phủ tiêu đề.',
      },
    },
  ],
}
