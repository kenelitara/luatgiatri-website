import type { CollectionConfig } from 'payload'
import { isAdminOrEditor } from '../access'
import { slugify } from '@/lib/slugify'
import { seoField } from '../fields/seo'

export const Tags: CollectionConfig = {
  slug: 'tags',
  labels: { singular: 'Thẻ', plural: 'Thẻ' },
  admin: { useAsTitle: 'title' },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    { name: 'title', type: 'text', label: 'Tên thẻ', required: true },
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