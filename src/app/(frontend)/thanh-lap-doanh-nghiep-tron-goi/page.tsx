import { notFound } from 'next/navigation'
import { PageShell } from '@/components/PageShell'
import { getPage } from '@/lib/getPage'

export const revalidate = 60

export default async function ThanhLapDoanhNghiepTronGoiPage() {
  const page = await getPage('thanh-lap-doanh-nghiep-tron-goi')
  if (!page) notFound()
  return <PageShell page={page} />
}
