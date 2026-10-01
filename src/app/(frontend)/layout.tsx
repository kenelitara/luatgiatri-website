import { Be_Vietnam_Pro } from 'next/font/google'
import type { Metadata } from 'next'
import { Footer } from '@/components/chrome/Footer'
import { Header } from '@/components/chrome/Header'
import { TopBar } from '@/components/chrome/TopBar'
import { getBaseUrl, isStaging } from '@/lib/site-env'
import '../globals.css'

const sans = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'], // vietnamese subset is REQUIRED (spec §6.8)
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-be-vietnam-pro',
})

export const metadata: Metadata = {
  // brand composition lives solely in buildMetadata (spec §6.1) — no title
  // template here, or a child segment's string title would double the brand.
  metadataBase: new URL(getBaseUrl()),
  robots: isStaging() ? { index: false, follow: false } : { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={sans.variable}>
      <body className="font-sans text-brand-950">
        <TopBar />
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
