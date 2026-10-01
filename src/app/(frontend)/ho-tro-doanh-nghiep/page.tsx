import { notFound } from 'next/navigation'
import { PageShell } from '@/components/PageShell'
import { getPage } from '@/lib/getPage'

export const revalidate = 60

export default async function HoTroDoanhNghiepPage() {
  const page = await getPage('ho-tro-doanh-nghiep')
  if (!page) notFound()
  return <PageShell page={page} />
}
