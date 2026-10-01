import type { Block } from 'payload'

export const HeroCarousel: Block = {
  slug: 'heroCarousel',
  labels: { singular: 'Hero nhiều slide', plural: 'Hero nhiều slide' },
  admin: {
    images: {
      thumbnail: { url: '/block-thumbnails/heroCarousel.svg', alt: 'Băng chuyền nhiều ảnh lớn có mũi tên và chấm chuyển slide' },
    },
  },
  fields: [
    {
      name: 'slides',
      type: 'array',
      label: 'Ảnh trình chiếu',
      // Row titles come from `labels.singular` ("Ảnh trình chiếu 01"), NOT from
      // the auto-derived English "Slide 01" (sanitizer: `field.labels =
      // field.labels || formatLabels(field.name)`). The BLOCK's own label
      // ("Hero nhiều slide") is deliberately left as-is.
      labels: { singular: 'Ảnh trình chiếu', plural: 'Ảnh trình chiếu' },
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
