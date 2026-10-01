import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'

export const Redirects: CollectionConfig = {
  slug: 'redirects',
  labels: { singular: 'Chuyển hướng', plural: 'Chuyển hướng (301/302/410)' },
  admin: { useAsTitle: 'from', defaultColumns: ['from', 'to', 'type'] },
  access: {
    read: () => true, // the app reads these to resolve legacy URLs
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'from', type: 'text', label: 'Từ đường dẫn cũ', required: true, unique: true },
    { name: 'to', type: 'text', label: 'Đến đường dẫn mới', admin: { description: 'Bỏ trống nếu chọn 410' } },
    {
      name: 'type',
      type: 'select',
      label: 'Loại',
      required: true,
      defaultValue: '301',
      options: [
        { label: '301 — chuyển hướng vĩnh viễn', value: '301' },
        { label: '302 — tạm thời', value: '302' },
        { label: '410 — đã bị xóa vĩnh viễn', value: '410' },
      ],
    },
  ],
}