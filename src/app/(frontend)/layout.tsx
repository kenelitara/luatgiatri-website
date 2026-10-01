import { Be_Vietnam_Pro } from 'next/font/google'
import type { Metadata } from 'next'
import { ConsentBanner } from '@/components/ConsentBanner'
import { Footer } from '@/components/chrome/Footer'
import { Header } from '@/components/chrome/Header'
import { TopBar } from '@/components/chrome/TopBar'
import { JsonLd } from '@/components/JsonLd'
import { sitewideSchemas } from '@/lib/schema-adapters'
import { getSiteSettings } from '@/lib/site'
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()
  const ga4Id = process.env.NEXT_PUBLIC_GA4_ID || undefined
  return (
    <html lang="vi" className={sans.variable}>
      <body className="font-sans text-brand-950">
        <JsonLd data={sitewideSchemas(settings)} />
        <TopBar />
        <Header />
        <main>{children}</main>
        <Footer />
        <ConsentBanner ga4Id={ga4Id} />
      </body>
    </html>
  )
}
