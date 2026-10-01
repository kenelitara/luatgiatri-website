import { notFound } from 'next/navigation'
import { PageShell } from '@/components/PageShell'
import { getPage } from '@/lib/getPage'

export const revalidate = 60

export default async function DichVuLienKetPage() {
  const page = await getPage('dich-vu-lien-ket')
  if (!page) notFound()
  return <PageShell page={page} />
}
