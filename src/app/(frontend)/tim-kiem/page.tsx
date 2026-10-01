import Link from 'next/link'
import type { Metadata } from 'next'
import { Heading } from '@/components/blocks/Heading'
import { searchAll, normalizeQuery } from '@/lib/search'
import { buildMetadata } from '@/lib/metadata'

export const revalidate = 0 // per-query results — never cached

/** spec §6.5: result pages carry noindex,follow so the index never fills with thin duplicates. */
export const metadata: Metadata = buildMetadata({
  title: 'Tìm kiếm',
  path: '/tim-kiem/',
  noindex: true,
})

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = normalizeQuery(q)
  let results: Awaited<ReturnType<typeof searchAll>> = []
  try {
    results = await searchAll(query)
  } catch {
    // DB-at-build convention: bake the empty state; the route is dynamic so it heals immediately
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-section">
      <h1 className="text-3xl font-bold text-brand-900">Tìm kiếm</h1>
      {query ? (
        <p className="mt-2 text-brand-700">
          {results.length} kết quả cho “{query}”
        </p>
      ) : (
        <p className="mt-2 text-brand-700">Nhập từ khóa để tìm dịch vụ và bài viết.</p>
      )}
      <div className="mt-8 space-y-6">
        {results.map((r) => (
          <article key={`${r.type}-${r.url}`}>
            <p className="text-xs uppercase tracking-wide text-brand-600">
              {r.type === 'page' ? 'Trang' : r.type === 'post' ? 'Bài viết' : 'Chuyên mục'}
            </p>
            <Heading level={2}>
              <Link href={r.url} className="hover:text-gold-700">
                {r.title}
              </Link>
            </Heading>
            {r.excerpt ? (
              <p className="mt-1 text-sm leading-6 text-brand-800">{r.excerpt}</p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}
