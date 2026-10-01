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
  hooks: {
    afterRead: [
      ({ doc }) => {
        // Payload appends the app's trailing slash to generated file URLs
        // (withPayload sets NEXT_TRAILING_SLASH from next.config.trailingSlash),
        // so stored `url` reads `/api/media/file/x.png/`. That URL 308-redirects
        // to the clean form — browsers cope, but next/image's optimizer does NOT
        // follow redirects and fails with "The requested resource isn't a valid
        // image", breaking every image. Normalize on read so every consumer
        // (block views, admin previews, M3's og:image / JSON-LD) sees the clean,
        // directly-servable URL. Found + fixed 2026-10-01 (post-M2 image bug).
        const strip = (o: { url?: string | null } | null | undefined): void => {
          if (o && typeof o.url === 'string') o.url = o.url.replace(/\/+$/, '')
        }
        strip(doc as { url?: string | null })
        if (doc.sizes && typeof doc.sizes === 'object') {
          for (const size of Object.values(
            doc.sizes as Record<string, { url?: string | null } | null>,
          )) {
            strip(size)
          }
        }
        return doc
      },
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
