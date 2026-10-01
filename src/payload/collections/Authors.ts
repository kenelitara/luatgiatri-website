import type { CollectionConfig } from 'payload'
import { isAdminOrEditor } from '../access'
import { slugify } from '@/lib/slugify'

/**
 * E-E-A-T surface (spec §5.2): public read (Person schema + post bylines),
 * writes gated to admin/editor. Seeded with the two named lawyers from the
 * live site's gioi-thieu page.
 */
export const Authors: CollectionConfig = {
  slug: 'authors',
  labels: { singular: 'Tác giả', plural: 'Tác giả' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'credentials'] },
  access: {
    read: () => true, // Person schema + post bylines are public
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    { name: 'name', type: 'text', label: 'Họ và tên', required: true },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      unique: true,
      admin: { position: 'sidebar', description: 'Bỏ trống để tự tạo từ tên.' },
      hooks: {
        beforeValidate: [
          ({ value, data }) => (value ? value : slugify((data?.name as string) ?? '')),
        ],
      },
    },
    {
      name: 'credentials',
      type: 'text',
      label: 'Chứng chỉ hành nghề',
      admin: {
        description: 'VD: Số CCCH LS xxx/ĐLN — tín hiệu E-E-A-T cho schema Person',
      },
    },
    { name: 'bio', type: 'textarea', label: 'Tiểu sử' },
    { name: 'photo', type: 'upload', label: 'Ảnh', relationTo: 'media' },
    {
      name: 'sameAs',
      type: 'text',
      label: 'sameAs',
      admin: { description: 'URL profile, cách nhau bằng dấu phẩy' },
    },
  ],
}
