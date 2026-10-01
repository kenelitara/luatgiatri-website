import type { Field } from 'payload'

/**
 * Shared SEO field group (spec §6.2/§6.5). Plain fields for now — the
 * character counter / SERP preview custom UI is M3.
 */
export const seoField: Field = {
  name: 'seo',
  type: 'group',
  label: 'SEO',
  fields: [
    {
      // Data-less `ui` field: a vessel for the SERP preview + live character
      // counters component (spec §6.2). Rendered once, above metaTitle.
      name: 'panel',
      type: 'ui',
      admin: {
        components: {
          // Alias form (`@/…`) rather than a leading-slash path: payload.config.ts
          // lives at the project root, so admin.importMap.baseDir defaults to the
          // root, and `/components/…` would resolve outside `src/`.
          Field: '@/components/admin/SeoPreview#SeoPanel',
        },
      },
    },
    { name: 'metaTitle', type: 'text', label: 'Thẻ tiêu đề (50–60 ký tự)' },
    {
      name: 'metaDescription',
      type: 'textarea',
      label: 'Mô tả (150–160 ký tự)',
    },
    {
      name: 'noindex',
      type: 'checkbox',
      label: 'Ẩn khỏi Google (noindex)',
      defaultValue: false,
      admin: {
        description:
          'Cách DUY NHẤT để một trang mang noindex. Không bật nếu không chắc chắn (spec §6.5).',
      },
    },
    {
      name: 'canonicalOverride',
      type: 'text',
      label: 'Canonical ghi đè (hiếm khi dùng)',
    },
    { name: 'ogImage', type: 'upload', label: 'Ảnh OG riêng', relationTo: 'media' },
  ],
}
