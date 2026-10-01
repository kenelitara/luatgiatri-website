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
    {
      name: 'email',
      type: 'email',
      label: 'Email',
      defaultValue: 'luatsu@luatgiatri.com',
      required: true,
    },
    {
      name: 'address',
      type: 'group',
      label: 'Địa chỉ (schema LocalBusiness cần các phần riêng lẻ)',
      fields: [
        {
          name: 'street',
          type: 'text',
          label: 'Số nhà + đường',
          defaultValue: '54/16 Đường số 2',
          required: true,
        },
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
      name: 'priceRange',
      type: 'text',
      label: 'Khoảng giá',
      admin: { description: 'Ví dụ: 500.000đ - 20.000.000đ (schema LegalService.priceRange)' },
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
    {
      name: 'logo',
      type: 'upload',
      label: 'Logo',
      relationTo: 'media',
      admin: {
        description:
          'Logo cho schema Organization / knowledge panel (JSON-LD logo & image). Để trống nếu chưa có.',
      },
    },
    {
      name: 'ga4Id',
      type: 'text',
      label: 'GA4 Measurement ID',
      // NOT read anywhere — the website's only GA4 source is the build-time
      // NEXT_PUBLIC_GA4_ID env var (it must be inlined into the client bundle,
      // so it cannot come from the DB). Kept only because dropping it needs a
      // migration; the description below tells operators not to rely on it.
      admin: {
        description:
          'Trường này KHÔNG được website sử dụng — nhập vào đây sẽ không bật Google Analytics. GA4 được cấu hình lúc triển khai bằng build arg NEXT_PUBLIC_GA4_ID (cần build lại; không sửa được từ admin).',
      },
    },
    { name: 'gscVerificationToken', type: 'text', label: 'Token xác minh Search Console' },
  ],
}
