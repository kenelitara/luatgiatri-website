import type { CollectionConfig } from 'payload'
import { isAdminOrEditor } from '../access'
import { slugify } from '@/lib/slugify'
import { seoField } from '../fields/seo'
import { writeSearchVector } from '../hooks/searchVector'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Bài viết', plural: 'Bài viết' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'publishedAt', 'author'],
    // NOTE (3.90.2 delta): livePreview.url as a plain string is used
    // verbatim as the iframe src — there is no `{field}` placeholder
    // interpolation in 3.90.2 — so the per-doc URL must be a function.
    // The front-end route /tin-tuc/[slug] arrives in Task 21; until then
    // the preview iframe will 404, which is acceptable (task note).
    livePreview: {
      url: ({ data }) => (data?.slug ? `/tin-tuc/${data.slug}` : null),
    },
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  versions: { drafts: true },
  hooks: { afterChange: [writeSearchVector('posts')] },
  fields: [
    { name: 'title', type: 'text', label: 'Tiêu đề', required: true },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      unique: true,
      admin: { position: 'sidebar', description: 'Bỏ trống để tự tạo từ tiêu đề.' },
      hooks: {
        beforeValidate: [
          ({ value, data }) => (value ? value : slugify((data?.title as string) ?? '')),
        ],
      },
    },
    {
      name: 'primaryHeading',
      type: 'text',
      label: 'Tiêu đề H1 (hiển thị trên trang)',
      required: true,
      admin: {
        description: 'Trang có đúng MỘT thẻ H1 lấy từ trường này (spec §6.4).',
      },
    },
    { name: 'excerpt', type: 'textarea', label: 'Tóm tắt' },
    { name: 'heroImage', type: 'upload', label: 'Ảnh bìa', relationTo: 'media' },
    { name: 'body', type: 'richText', label: 'Nội dung', required: true },
    {
      name: 'categories',
      type: 'relationship',
      label: 'Chuyên mục',
      relationTo: 'categories',
      hasMany: true,
    },
    { name: 'tags', type: 'relationship', label: 'Thẻ', relationTo: 'tags', hasMany: true },
    {
      name: 'author',
      type: 'relationship',
      label: 'Tác giả',
      relationTo: 'authors',
      required: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Ngày đăng',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Nổi bật',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    seoField,
  ],
}
