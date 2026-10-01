import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageShell } from '@/components/PageShell'
import { getPage } from '@/lib/getPage'
import { getSiteSettings } from '@/lib/site'
import { buildMetadata } from '@/lib/metadata'
import { pageMetadata } from '@/lib/seo-helpers'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getPage('dich-vu-ke-toan'), getSiteSettings()])
  if (!page)
    return buildMetadata({ title: 'Luật Gia Trí', path: '/dich-vu-ke-toan/', branded: false })
  return buildMetadata(pageMetadata(page, settings))
}

export default async function DichVuKeToanPage() {
  const page = await getPage('dich-vu-ke-toan')
  if (!page) notFound()
  return <PageShell page={page} />
}
