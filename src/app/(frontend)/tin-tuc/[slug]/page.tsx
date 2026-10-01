import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatViDate } from '@/lib/date'
import { getPost } from '@/lib/getPage'
import { getSiteSettings } from '@/lib/site'
import { buildMetadata } from '@/lib/metadata'
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
