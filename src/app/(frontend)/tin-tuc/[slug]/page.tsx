import { RichText } from '@payloadcms/richtext-lexical/react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatViDate } from '@/lib/date'
import { getPayloadClient } from '@/lib/getPayload'
import type { Post } from '@/payload-types'

export const revalidate = 60

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let post: Post | null = null
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'posts',
      where: { slug: { equals: slug }, _status: { equals: 'published' } },
      draft: false,
      depth: 2,
      limit: 1,
    })
    post = docs[0] ?? null
  } catch {
    // DB-at-build convention: bake the notFound fallback; ISR heals at runtime
  }
  if (!post) notFound()

  const author = typeof post.author === 'object' ? post.author : null
  const hero = post.heroImage && typeof post.heroImage === 'object' ? post.heroImage : null

  return (
    <article className="mx-auto max-w-3xl px-4 py-section">
      <p className="text-sm text-brand-600">
        {post.publishedAt ? formatViDate(post.publishedAt) : ''}
      </p>
      <h1 className="mt-1 text-3xl font-bold text-brand-900">{post.primaryHeading}</h1>
      {author ? (
        <p className="mt-2 text-sm text-brand-700">
          Tác giả:{' '}
          <Link href="/gioi-thieu/" className="font-semibold">
            {author.name}
          </Link>
          {author.credentials ? ` — ${author.credentials}` : ''}
        </p>
      ) : null}
      {hero?.url ? (
        <div className="relative mt-6 aspect-[2/1]">
          <Image
            src={hero.url}
            alt={hero.alt}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="rounded object-cover"
          />
        </div>
      ) : null}
      <div className="prose mt-6">
        <RichText data={post.body} />
      </div>
    </article>
  )
}
