import { notFound } from 'next/navigation'
import { PageShell } from '@/components/PageShell'
import { getPage } from '@/lib/getPage'

export const revalidate = 60

export default async function DichVuKeToanPage() {
  const page = await getPage('dich-vu-ke-toan')
  if (!page) notFound()
  return <PageShell page={page} />
}
