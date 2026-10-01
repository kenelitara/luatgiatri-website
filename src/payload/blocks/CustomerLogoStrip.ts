import type { Block } from 'payload'

export const CustomerLogoStrip: Block = {
  slug: 'customerLogoStrip',
  labels: { singular: 'Dải logo khách hàng', plural: 'Dải logo khách hàng' },
  admin: {
    images: {
      thumbnail: { url: '/block-thumbnails/customerLogoStrip.svg', alt: 'Dải logo khách hàng xếp thành một hàng' },
    },
  },
  fields: [
    {
      name: 'logos',
      type: 'array',
      label: 'Logo',
      // Row titles are built from `labels.singular` (ArrayRow.js), NOT from
      // `label` — and Payload's sanitizer auto-derives `labels` from the ENGLISH
      // field NAME when only `label` is set (`field.labels = field.labels ||
      // formatLabels(field.name)`). Set explicitly; admin-only, no migration.
      labels: { singular: 'Logo', plural: 'Logo' },
      required: true,
      fields: [
        { name: 'image', type: 'upload', label: 'Logo', relationTo: 'media', required: true },
        { name: 'url', type: 'text', label: 'URL' },
      ],
    },
  ],
}
