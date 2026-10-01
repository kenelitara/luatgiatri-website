import type { CollectionConfig } from 'payload'
import { isAdminOrEditor } from '../access'
import { slugify } from '@/lib/slugify'
import { isReservedRootSegment } from '@/lib/reserved-slugs'
import { seoField } from '../fields/seo'
import { Hero } from '../blocks/Hero'
import { HeroCarousel } from '../blocks/HeroCarousel'
import { RichText } from '../blocks/RichText'
import { ServicePair } from '../blocks/ServicePair'
import { FeatureGrid } from '../blocks/FeatureGrid'
import { PricingTable } from '../blocks/PricingTable'
import { TokenMatrix } from '../blocks/TokenMatrix'
import { Faq } from '../blocks/Faq'
import { Testimonials } from '../blocks/Testimonials'
import { CustomerLogoStrip } from '../blocks/CustomerLogoStrip'
import { TeamGrid } from '../blocks/TeamGrid'
import { ProcessSteps } from '../blocks/ProcessSteps'
import { CtaBanner } from '../blocks/CtaBanner'
import { NewsPreview } from '../blocks/NewsPreview'
import { FormEmbed } from '../blocks/FormEmbed'
import { writeSearchVector } from '../hooks/searchVector'

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
  hooks: { afterChange: [writeSearchVector('pages')] },
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
      // A page must never claim a root segment owned by another route (admin,
      // api, og, tin-tuc, tim-kiem, …). The dynamic `(frontend)/[slug]` route
      // refuses these too, but rejecting them here fails closed in the editor:
      // the slug can never be created in the first place. See lib/reserved-slugs.
      validate: (value: unknown) =>
        typeof value === 'string' && isReservedRootSegment(value)
          ? `Slug "${value}" trùng với đường dẫn hệ thống (admin, api, og, tin-tuc, tim-kiem). Vui lòng chọn slug khác.`
          : true,
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
        description:
          'Trang có đúng MỘT thẻ H1 lấy từ trường này. H1 mang từ khóa chính của trang — thương hiệu "Luật Gia Trí" được tự động thêm vào tiêu đề (<title>) và schema, không cần lặp lại trong H1 (spec §6.9).',
      },
    },
    {
      name: 'layout',
      type: 'blocks',
      label: 'Bố cục',
      // The block-picker drawer title is built from the field's `labels.singular`
      // (`fields:addLabel` → "Thêm: {{label}}"), NOT from `label`. Payload's field
      // sanitizer auto-derives `labels` from the field NAME when a `label` is set
      // (payload/dist/fields/config/sanitize.js: `field.labels = field.labels
      // || formatLabels(field.name)`), which rendered the drawer title as the
      // English "Thêm: Layout". Setting `labels` explicitly overrides it.
      labels: { singular: 'Bố cục', plural: 'Bố cục' },
      required: true,
      blocks: [
        Hero,
        HeroCarousel,
        RichText,
        ServicePair,
        FeatureGrid,
        PricingTable,
        TokenMatrix,
        Faq,
        Testimonials,
        CustomerLogoStrip,
        TeamGrid,
        ProcessSteps,
        CtaBanner,
        NewsPreview,
        FormEmbed,
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
