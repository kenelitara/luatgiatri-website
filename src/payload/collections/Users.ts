import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminField } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Người dùng', plural: 'Người dùng' },
  auth: true,
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'email', 'roles'],
  },
  access: {
    // any signed-in user may reach the admin panel; only admins create/delete
    // users. Self-update stays allowed by Payload's auth-collection defaults.
    admin: ({ req: { user } }) => Boolean(user),
    create: isAdmin,
    delete: isAdmin,
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
      // field access resolves per-operation: guard create too, or an editor
      // could mint an admin on user-create
      access: { create: isAdminField, update: isAdminField },
      options: [
        { label: 'Quản trị', value: 'admin' },
        { label: 'Biên tập', value: 'editor' },
      ],
    },
  ],
}
