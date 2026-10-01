import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Thông tin website',
  access: {
    read: () => true, // public: every page reads NAP for the footer/schema
    update: isAdmin,
  },
  fields: [
    {
      name: 'brandName',
      type: 'text',
      label: 'Tên thương hiệu',
      required: true,
      defaultValue: 'Luật Gia Trí',
      admin: {
        description:
          'Nguồn gốc duy nhất cho tiêu đề, og:site_name và schema. Không dùng "MẠCH GIA PHÁT" (lỗi của site cũ).',
      },
    },
    { name: 'legalEntityName', type: 'text', label: 'Tên pháp nhân' },
    { name: 'taxCode', type: 'text', label: 'Mã số thuế' },
    { name: 'hotline', type: 'text', label: 'Hotline', defaultValue: '0919088119', required: true },
    { name: 'email', type: 'email', label: 'Email', defaultValue: 'luatsu@luatgiatri.com', required: true },
    {
      name: 'address',
      type: 'group',
      label: 'Địa chỉ (schema LocalBusiness cần các phần riêng lẻ)',
      fields: [
        { name: 'street', type: 'text', label: 'Số nhà + đường', defaultValue: '54/16 Đường số 2', required: true },
        { name: 'ward', type: 'text', label: 'Phường/Khu phố' },
        { name: 'district', type: 'text', label: 'Quận', defaultValue: 'Bình Tân', required: true },
        { name: 'city', type: 'text', label: 'Tỉnh/TP', defaultValue: 'TP.HCM', required: true },
        { name: 'country', type: 'text', label: 'Quốc gia', defaultValue: 'VN', required: true },
      ],
    },
    {
      name: 'openingHours',
      type: 'text',
      label: 'Giờ mở cửa',
      admin: { description: 'Ví dụ: Mo-Fr 08:00-17:30' },
    },
    {
      name: 'socials',
      type: 'group',
      label: 'Mạng xã hội (sameAs cho schema)',
      fields: [
        { name: 'facebook', type: 'text', label: 'Facebook URL' },
        { name: 'zalo', type: 'text', label: 'Zalo OA URL' },
        { name: 'youtube', type: 'text', label: 'YouTube URL' },
        { name: 'googleBusinessProfile', type: 'text', label: 'Google Business Profile URL' },
      ],
    },
    { name: 'defaultOgImage', type: 'upload', label: 'Ảnh OG mặc định', relationTo: 'media' },
    { name: 'ga4Id', type: 'text', label: 'GA4 Measurement ID', admin: { description: 'Để trống nếu chưa dùng' } },
    { name: 'gscVerificationToken', type: 'text', label: 'Token xác minh Search Console' },
  ],
}