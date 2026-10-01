import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageShell } from '@/components/PageShell'
import { getPage } from '@/lib/getPage'
import { getSiteSettings } from '@/lib/site'
import { buildMetadata } from '@/lib/metadata'
import { pageMetadata } from '@/lib/seo-helpers'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getPage('dich-vu-lien-ket'), getSiteSettings()])
  if (!page)
    return buildMetadata({ title: 'Luật Gia Trí', path: '/dich-vu-lien-ket/', branded: false })
  return buildMetadata(pageMetadata(page, settings))
}

export default async function DichVuLienKetPage() {
  const page = await getPage('dich-vu-lien-ket')
  if (!page) notFound()
  return <PageShell page={page} />
}
