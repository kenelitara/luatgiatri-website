import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/JsonLd'
import { formatViDate } from '@/lib/date'
import { getPost } from '@/lib/getPage'
import { getSiteSettings } from '@/lib/site'
import { buildMetadata } from '@/lib/metadata'
import { postSchemas } from '@/lib/schema-adapters'
import { postMetadata } from '@/lib/seo-helpers'

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const [post, settings] = await Promise.all([getPost(slug), getSiteSettings()])
  if (!post) return buildMetadata({ title: 'Tin tức', path: '/tin-tuc/' })
  return buildMetadata(postMetadata(post, settings))
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const author = typeof post.author === 'object' ? post.author : null
  const hero = post.heroImage && typeof post.heroImage === 'object' ? post.heroImage : null

  return (
    // max-w-6xl, matching the news index and the category archive: a card
    // clicked in a 6xl grid must not land on a 3xl page. Widening this is safe
    // for readability because `.prose` in globals.css caps the BODY text at
    // 65ch independent of the container — only the title, meta line and hero
    // image grow.
    <article className="mx-auto max-w-6xl px-4 py-section">
      <JsonLd
        data={postSchemas({
          title: post.title,
          slug: post.slug ?? slug, // route param is the same slug getPost matched on
          excerpt: post.excerpt,
          publishedAt: post.publishedAt,
          updatedAt: post.updatedAt,
          author: typeof post.author === 'object' ? post.author : null,
        })}
      />
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
            // `preload` (NOT the deprecated `priority` — Next 16.3.6 types mark
            // `priority` @deprecated in favour of `preload`). The hero is the
            // page's LCP element and next/image lazy-loads by default, so
            // without this the largest paint waits on the lazy loader — a real
            // Core Web Vitals cost on a site whose whole purpose is ranking.
            preload
            sizes="(max-width: 1152px) 100vw, 1152px"
            className="rounded object-cover"
          />
        </div>
      ) : null}
      {/* `prose--fill` opts this body out of the readable measure so it aligns
          with the container (client decision, see globals.css). Scoped: every
          other .prose consumer keeps the default cap. */}
      <div className="prose prose--fill mt-6">
        <RichText data={post.body} />
      </div>
    </article>
  )
}
