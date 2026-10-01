import Image from 'next/image'
import Link from 'next/link'
import type { Page } from '@/payload-types'

type HeroBlock = Extract<NonNullable<Page['layout']>[number], { blockType: 'hero' }>

/**
 * The banner headline is deliberately an <h2>: the page shell (PageShell)
 * owns the single <h1> from primaryHeading, and the hero headline is a
 * slogan field, distinct from primaryHeading (spec §6.4).
 */
export function HeroView({ block }: { block: HeroBlock }) {
  const img = typeof block.image === 'object' ? block.image : null
  return (
    <section className="relative aspect-[21/9] min-h-[320px] w-full overflow-hidden">
      {img?.url ? (
        <Image src={img.url} alt={img.alt} fill priority sizes="100vw" className="object-cover" />
      ) : null}
      <div className="absolute inset-0 bg-brand-950/55" />
      <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-center px-4 text-white">
        <h2 className="max-w-2xl text-hero font-bold">{block.headline}</h2>
        {block.subheadline ? <p className="mt-3 max-w-xl text-lg">{block.subheadline}</p> : null}
        {block.ctaHref && block.ctaLabel ? (
          <Link
            href={block.ctaHref}
            className="mt-6 w-fit rounded bg-gold-500 px-6 py-3 font-semibold text-brand-950 hover:bg-gold-400"
          >
            {block.ctaLabel}
          </Link>
        ) : null}
      </div>
    </section>
  )
}
