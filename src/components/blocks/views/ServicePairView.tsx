import Image from 'next/image'
import Link from 'next/link'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { Heading } from '../Heading'
import type { Page } from '@/payload-types'

type ServicePairBlock = Extract<NonNullable<Page['layout']>[number], { blockType: 'servicePair' }>

/** Alternating two-column section (spec §3.3); `reverse` flips the image column. */
export function ServicePairView({ block }: { block: ServicePairBlock }) {
  const img = typeof block.image === 'object' ? block.image : null
  return (
    <section className="mx-auto max-w-6xl px-4 py-section">
      <div
        className={`grid items-center gap-8 md:grid-cols-2 ${block.reverse ? 'md:[&>*:first-child]:order-2' : ''}`}
      >
        <div className="relative aspect-[4/3]">
          {img?.url ? (
            <Image
              src={img.url}
              alt={img.alt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="rounded object-cover"
            />
          ) : null}
        </div>
        <div>
          <Heading>{block.heading}</Heading>
          <div className="prose">
            <RichText data={block.body} />
          </div>
          {block.bullets?.length ? (
            <ul className="mt-4 space-y-2">
              {block.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-gold-700">✔</span> {b.item}
                </li>
              ))}
            </ul>
          ) : null}
          {block.ctaHref && block.ctaLabel ? (
            <Link
              href={block.ctaHref}
              className="mt-6 inline-block font-semibold text-gold-700 hover:text-gold-600"
            >
              {block.ctaLabel} →
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}
