import { notFound } from 'next/navigation'
import { PageShell } from '@/components/PageShell'
import { getPage } from '@/lib/getPage'

export const revalidate = 60

export default async function GioiThieuPage() {
  const page = await getPage('gioi-thieu')
  if (!page) notFound()
  return <PageShell page={page} />
}
