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
      required: true,
      fields: [
        { name: 'image', type: 'upload', label: 'Logo', relationTo: 'media', required: true },
        { name: 'url', type: 'text', label: 'URL' },
      ],
    },
  ],
}
