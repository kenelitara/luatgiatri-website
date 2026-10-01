import { notFound } from 'next/navigation'
import { PageShell } from '@/components/PageShell'
import { getPage } from '@/lib/getPage'

export const revalidate = 60

export default async function ChuKySoTokenPage() {
  const page = await getPage('chu-ky-so-token')
  if (!page) notFound()
  return <PageShell page={page} />
}
