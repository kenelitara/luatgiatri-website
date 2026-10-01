import type { Block } from 'payload'

export const TeamGrid: Block = {
  slug: 'teamGrid',
  labels: { singular: 'Đội ngũ luật sư', plural: 'Đội ngũ luật sư' },
  admin: {
    images: {
      thumbnail: { url: '/block-thumbnails/teamGrid.svg', alt: 'Thẻ thành viên đội ngũ với ảnh tròn và tên' },
    },
  },
  fields: [
    { name: 'heading', type: 'text', label: 'Tiêu đề', defaultValue: 'Đội ngũ của chúng tôi' },
    {
      name: 'members',
      type: 'relationship',
      label: 'Thành viên (từ Tác giả)',
      relationTo: 'authors',
      hasMany: true,
      required: true,
    },
  ],
}
