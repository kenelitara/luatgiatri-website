import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageShell } from '@/components/PageShell'
import { getPage } from '@/lib/getPage'
import { getSiteSettings } from '@/lib/site'
import { buildMetadata, DEFAULT_BRAND } from '@/lib/metadata'
import { pageMetadata } from '@/lib/seo-helpers'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([
    getPage('thanh-lap-doanh-nghiep-tron-goi'),
    getSiteSettings(),
  ])
  if (!page)
    return buildMetadata({
      title: DEFAULT_BRAND,
      path: '/thanh-lap-doanh-nghiep-tron-goi/',
      branded: false,
    })
  return buildMetadata(pageMetadata(page, settings))
}

export default async function ThanhLapDoanhNghiepTronGoiPage() {
  const page = await getPage('thanh-lap-doanh-nghiep-tron-goi')
  if (!page) notFound()
  return <PageShell page={page} />
}
