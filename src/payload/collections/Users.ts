import type { CollectionConfig } from 'payload'
import { isAdminField } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Người dùng', plural: 'Người dùng' },
  auth: true,
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'email', 'roles'],
  },
  access: {
    // only signed-in users manage users; self-update stays allowed by Payload's defaults
    admin: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    { name: 'fullName', type: 'text', label: 'Họ và tên', required: true },
    {
      name: 'roles',
      type: 'select',
      label: 'Vai trò',
      hasMany: true,
      required: true,
      defaultValue: ['editor'],
      access: { update: isAdminField },
      options: [
        { label: 'Quản trị', value: 'admin' },
        { label: 'Biên tập', value: 'editor' },
      ],
    },
  ],
}