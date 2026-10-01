import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Heading } from '@/components/blocks/Heading'
import { getPayloadClient } from '@/lib/getPayload'
import { buildMetadata } from '@/lib/metadata'
import { formatViDate } from '@/lib/date'

export const revalidate = 60

async function getCategory(slug: string) {
  try {
    const payload = await getPayloadClient()
    const cats = await payload.find({
      collection: 'categories',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    const category = cats.docs[0]
    if (!category) return { category: undefined, posts: [] }
    const posts = await payload.find({
      collection: 'posts',
      limit: 50,
      sort: '-publishedAt',
      draft: false,
      where: { and: [{ _status: { equals: 'published' } }, { categories: { in: [category.id] } }] },
    })
    return { category, posts: posts.docs }
  } catch {
    // DB-at-build convention (AGENTS.md): no DB at build bakes the notFound
    // fallback; the first runtime request past the revalidate window heals via ISR.
    return { category: undefined, posts: [] }
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  try {
    const { category } = await getCategory(slug)
    if (!category) return buildMetadata({ title: 'Chuyên mục', path: `/tin-tuc/chuyen-muc/${slug}/` })
    return buildMetadata({
      title: category.seo?.metaTitle || category.title,
      description: category.seo?.metaDescription,
      path: `/tin-tuc/chuyen-muc/${slug}/`,
      noindex: category.seo?.noindex ?? false,
      canonicalOverride: category.seo?.canonicalOverride ?? null,
    })
  } catch {
    return buildMetadata({ title: 'Chuyên mục', path: `/tin-tuc/chuyen-muc/${slug}/` })
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { category, posts } = await getCategory(slug)
  if (!category) notFound()
  return (
    <section className="mx-auto max-w-6xl px-4 py-section">
      <h1 className="text-3xl font-bold text-brand-900">{category.title}</h1>
      {posts.length === 0 ? (
        <p className="mt-4 text-brand-800">Chưa có bài viết trong chuyên mục này.</p>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {posts.map((p) => (
            <article key={p.id} className="rounded bg-white p-6 shadow-sm">
              <p className="text-xs text-brand-600">
                {p.publishedAt ? formatViDate(p.publishedAt) : ''}
              </p>
              <Heading level={2}>
                <Link href={`/tin-tuc/${p.slug}/`} className="hover:text-gold-700">
                  {p.title}
                </Link>
              </Heading>
              {p.excerpt ? <p className="mt-2 text-sm leading-6 text-brand-800">{p.excerpt}</p> : null}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
