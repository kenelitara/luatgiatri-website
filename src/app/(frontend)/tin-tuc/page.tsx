import type { Metadata } from 'next'
import Link from 'next/link'
import { Heading } from '@/components/blocks/Heading'
import { formatViDate } from '@/lib/date'
import { getPayloadClient } from '@/lib/getPayload'
import { getSiteSettings } from '@/lib/site'
import { buildMetadata } from '@/lib/metadata'
import { staticMetadata } from '@/lib/seo-helpers'
import type { Post } from '@/payload-types'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return buildMetadata(
    staticMetadata(
      { title: 'Tin tức', description: 'Tin tức và sự kiện từ Luật Gia Trí', path: '/tin-tuc/' },
      settings,
    ),
  )
}

export default async function TinTucPage() {
  let docs: Post[] = []
  try {
    const payload = await getPayloadClient()
    ;({ docs } = await payload.find({
      collection: 'posts',
      limit: 10,
      sort: '-publishedAt',
      draft: false,
      where: { _status: { equals: 'published' } },
    }))
  } catch {
    // DB-at-build convention: bake the empty state; ISR heals at runtime
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-section">
      <h1 className="text-3xl font-bold text-brand-900">Tin tức</h1>
      {docs.length === 0 ? (
        <p className="mt-4 text-brand-800">Chưa có bài viết.</p>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {docs.map((post) => (
            <article key={post.id} className="rounded bg-white p-6 shadow-sm">
              <p className="text-xs text-brand-600">
                {post.publishedAt ? formatViDate(post.publishedAt) : ''}
              </p>
              <Heading level={2}>
                <Link href={`/tin-tuc/${post.slug ?? post.id}/`} className="hover:text-gold-700">
                  {post.title}
                </Link>
              </Heading>
              {post.excerpt ? (
                <p className="mt-2 text-sm leading-6 text-brand-800">{post.excerpt}</p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
