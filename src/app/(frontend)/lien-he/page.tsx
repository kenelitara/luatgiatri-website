import { notFound } from 'next/navigation'
import { PageShell } from '@/components/PageShell'
import { getPage } from '@/lib/getPage'

export const revalidate = 60

export default async function LienHePage() {
  const page = await getPage('lien-he')
  if (!page) notFound()
  return <PageShell page={page} />
}
