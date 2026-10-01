import type { CollectionConfig } from 'payload'
import { isAdminOrEditor } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Tệp media', plural: 'Tệp media' },
  admin: { defaultColumns: ['filename', 'alt', 'mimeType'] },
  access: {
    read: () => true, // public: images render on every page
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  // Note: Payload 3.90.2 has no per-collection `staticURL` option (Payload 2
  // API); uploads serve at `/api/media/file/<filename>`
  // (routes.api + `/{slug}/file/…` — verified by curl in Task 11).
  upload: {
    staticDir: 'data/media',
    mimeTypes: ['image/*'],
    imageSizes: [
      { name: 'thumbnail', width: 320 },
      { name: 'card', width: 600 },
      { name: 'hero', width: 1200 },
      { name: 'og', width: 1200, height: 630 },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Văn bản thay thế (alt)',
      required: true, // spec §5.2: enforced by the schema, not by convention
      admin: { description: 'Bắt buộc — dùng cho accessibility và SEO ảnh.' },
    },
    { name: 'caption', type: 'text', label: 'Chú thích' },
  ],
}