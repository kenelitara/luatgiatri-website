import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageShell } from '@/components/PageShell'
import { getPage } from '@/lib/getPage'
import { getSiteSettings } from '@/lib/site'
import { buildMetadata } from '@/lib/metadata'
import { pageMetadata } from '@/lib/seo-helpers'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getPage('chinh-sach-bao-mat'), getSiteSettings()])
  if (!page) {
    return buildMetadata({
      title: 'Chính sách bảo mật',
      path: '/chinh-sach-bao-mat/',
      branded: false,
    })
  }
  return buildMetadata(pageMetadata(page, settings))
}

export default async function ChinhSachBaoMatPage() {
  const page = await getPage('chinh-sach-bao-mat')
  if (!page) notFound()
  return <PageShell page={page} />
}
