import type { CollectionConfig } from 'payload'
import { isAdminOrEditor } from '../access'
import { slugify } from '@/lib/slugify'
import { seoField } from '../fields/seo'
import { writeSearchVector } from '../hooks/searchVector'

// Categories are indexable landing pages (spec §5.2) — they carry the seo group.
export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Chuyên mục', plural: 'Chuyên mục' },
  admin: { useAsTitle: 'title' },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  hooks: { afterChange: [writeSearchVector('categories')] },
  fields: [
    { name: 'title', type: 'text', label: 'Tên chuyên mục', required: true },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      unique: true,
      admin: { position: 'sidebar' },
      hooks: {
        beforeValidate: [
          ({ value, data }) => (value ? value : slugify((data?.title as string) ?? '')),
        ],
      },
    },
    seoField,
  ],
}
