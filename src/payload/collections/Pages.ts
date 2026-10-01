import type { CollectionConfig } from 'payload'
import { isAdminOrEditor } from '../access'
import { slugify } from '@/lib/slugify'
import { seoField } from '../fields/seo'
import { Hero } from '../blocks/Hero'
import { HeroCarousel } from '../blocks/HeroCarousel'
import { RichText } from '../blocks/RichText'
import { ServicePair } from '../blocks/ServicePair'
import { FeatureGrid } from '../blocks/FeatureGrid'
import { PricingTable } from '../blocks/PricingTable'
import { Faq } from '../blocks/Faq'
import { Testimonials } from '../blocks/Testimonials'
import { CustomerLogoStrip } from '../blocks/CustomerLogoStrip'
import { TeamGrid } from '../blocks/TeamGrid'
import { ProcessSteps } from '../blocks/ProcessSteps'
import { CtaBanner } from '../blocks/CtaBanner'
import { NewsPreview } from '../blocks/NewsPreview'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Trang', plural: 'Trang' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    // 3.90.2: `url` must be a function — a plain string is used verbatim (verified in Task 12)
    livePreview: { url: ({ data }) => (data?.slug ? `/${data.slug}` : null) },
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  versions: { drafts: true },
  fields: [
    { name: 'title', type: 'text', label: 'Tiêu đề (admin)', required: true },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      unique: true,
      required: true,
      admin: {
        position: 'sidebar',
        description:
          'Giữ nguyên slug cũ khi chuyển nội dung — URL đang dùng không được đổi (spec §6.7).',
      },
      hooks: {
        beforeValidate: [({ value, data }) => (value ? value : slugify((data?.title as string) ?? ''))],
      },
    },
    {
      name: 'primaryHeading',
      type: 'text',
      label: 'Tiêu đề H1 (hiển thị trên trang)',
      required: true,
      admin: {
        description:
          'Trang có đúng MỘT thẻ H1 lấy từ trường này. Trang chủ PHẢI chứa chuỗi "Luật Gia Trí" (spec §6.9).',
      },
    },
    {
      name: 'layout',
      type: 'blocks',
      label: 'Bố cục',
      required: true,
      blocks: [
        Hero,
        HeroCarousel,
        RichText,
        ServicePair,
        FeatureGrid,
        PricingTable,
        Faq,
        Testimonials,
        CustomerLogoStrip,
        TeamGrid,
        ProcessSteps,
        CtaBanner,
        NewsPreview,
      ],
    },
    {
      name: 'serviceMeta',
      type: 'group',
      label: 'Thông tin dịch vụ (chỉ trang dịch vụ)',
      admin: {
        condition: (_data, siblingData) => {
          const serviceSlugs = [
            'thanh-lap-doanh-nghiep-tron-goi',
            'dich-vu-ke-toan',
            'hoa-don-dien-tu',
            'chu-ky-so-token',
            'dich-vu-lien-ket',
            'ho-tro-doanh-nghiep',
          ]
          return serviceSlugs.includes((siblingData?.slug as string) ?? '')
        },
      },
      fields: [
        { name: 'serviceName', type: 'text', label: 'Tên dịch vụ' },
        { name: 'shortDescription', type: 'textarea', label: 'Mô tả ngắn' },
        { name: 'fromPrice', type: 'text', label: 'Giá từ' },
        { name: 'icon', type: 'upload', label: 'Icon', relationTo: 'media' },
        {
          name: 'relatedServices',
          type: 'relationship',
          label: 'Dịch vụ liên quan',
          relationTo: 'pages',
          hasMany: true,
          filterOptions: {
            slug: {
              in: [
                'thanh-lap-doanh-nghiep-tron-goi',
                'dich-vu-ke-toan',
                'hoa-don-dien-tu',
                'chu-ky-so-token',
                'dich-vu-lien-ket',
                'ho-tro-doanh-nghiep',
              ],
            },
          },
        },
      ],
    },
    seoField,
  ],
}