import type { CollectionConfig } from 'payload'
import { isAdminOrEditor } from '../access'
import { slugify } from '@/lib/slugify'
import { postUrl } from '@/lib/revalidate-paths'
import { seoField } from '../fields/seo'
import { writeSearchVector } from '../hooks/searchVector'
import { revalidatePosts, revalidatePostsDelete } from '../hooks/revalidate'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Bài viết', plural: 'Bài viết' },
  admin: {
    useAsTitle: 'title',
    // `_status` matters most here: the firm authors articles as drafts, so the
    // list must distinguish unpublished from live at a glance.
    defaultColumns: ['title', '_status', 'publishedAt', 'author'],
    // 3.90.2: livePreview.url as a plain string is used verbatim as the iframe
    // src — there is no `{field}` placeholder interpolation — so the per-doc
    // URL must be a function. It now targets the /next/preview route, which
    // enables Next Draft Mode and redirects to the post, so an unpublished
    // draft is previewable instead of 404ing. Trailing slash on the route: it is
    // canonical under `trailingSlash: true`.
    livePreview: {
      url: ({ data }) => {
        const path = postUrl(data?.slug as string | undefined)
        return path ? `/next/preview/?path=${encodeURIComponent(path)}` : null
      },
    },
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  versions: { drafts: true },
  hooks: {
    afterChange: [writeSearchVector('posts'), revalidatePosts],
    afterDelete: [revalidatePostsDelete],
  },
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
