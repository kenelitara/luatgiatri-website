import { notFound } from 'next/navigation'
import { PageShell } from '@/components/PageShell'
import { getPage } from '@/lib/getPage'

export const revalidate = 60

export default async function HoaDonDienTuPage() {
  const page = await getPage('hoa-don-dien-tu')
  if (!page) notFound()
  return <PageShell page={page} />
}
