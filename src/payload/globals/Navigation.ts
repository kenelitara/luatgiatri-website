import type { GlobalConfig } from 'payload'
import { isAdminOrEditor } from '../access'

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Menu điều hướng',
  access: { read: () => true, update: isAdminOrEditor },
  fields: [
    {
      name: 'headerItems',
      type: 'array',
      label: 'Menu trên cùng',
      required: true,
      fields: [
        { name: 'label', type: 'text', label: 'Nhãn', required: true },
        { name: 'href', type: 'text', label: 'Đường dẫn', required: true },
      ],
    },
    {
      name: 'footerLinks',
      type: 'array',
      label: 'Liên kết chân trang',
      fields: [
        { name: 'label', type: 'text', label: 'Nhãn', required: true },
        { name: 'href', type: 'text', label: 'Đường dẫn', required: true },
      ],
    },
  ],
}