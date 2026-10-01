import Link from 'next/link'
import { formatViDate } from '@/lib/date'
import { Heading } from '../Heading'
import type { Page } from '@/payload-types'

type NewsPreviewBlock = Extract<NonNullable<Page['layout']>[number], { blockType: 'newsPreview' }>

/** Latest three published posts (spec §5.3 "Tin tức & Sự kiện"). */
export async function NewsPreviewView({ block }: { block: NewsPreviewBlock }) {
  // Dynamic import keeps the Payload runtime (and the `@payload-config`
  // alias, which vitest cannot resolve) out of the unit-test module graph.
  const { getPayloadClient } = await import('@/lib/getPayload')
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'posts',
    limit: 3,
    sort: '-publishedAt',
    draft: false,
    where: { _status: { equals: 'published' } },
  })

  return (
    <section className="mx-auto max-w-6xl px-4 py-section">
      <Heading>{block.heading}</Heading>
      {docs.length === 0 ? (
        <p className="text-brand-800">Chưa có bài viết. Nội dung mới sẽ sớm được cập nhật.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {docs.map((post) => (
            <article key={post.id} className="rounded bg-white p-6 shadow-sm">
              <p className="text-xs text-brand-600">
                {post.publishedAt ? formatViDate(post.publishedAt) : ''}
              </p>
              <Heading level={3}>
                <Link href={`/tin-tuc/${post.slug}/`} className="hover:text-gold-700">
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
      <Link
        href={block.ctaHref ?? '/tin-tuc/'}
        className="mt-6 inline-block font-semibold text-gold-700 hover:text-gold-600"
      >
        Xem tất cả →
      </Link>
    </section>
  )
}
