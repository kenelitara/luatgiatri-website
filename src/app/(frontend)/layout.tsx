import type { Metadata } from 'next'
import '../globals.css'

const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://luatgiatri.com'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: { default: 'Luật Gia Trí', template: '%s | Luật Gia Trí' },
  robots:
    process.env.SITE_ENV === 'staging'
      ? { index: false, follow: false }
      : { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  )
}