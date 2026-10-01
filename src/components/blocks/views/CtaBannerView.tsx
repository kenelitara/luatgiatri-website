import Link from 'next/link'
import type { Page } from '@/payload-types'

type CtaBannerBlock = Extract<NonNullable<Page['layout']>[number], { blockType: 'ctaBanner' }>

/** The banner <h2> is this block's own markup (spec §6.4: blocks start at h2). */
export function CtaBannerView({ block }: { block: CtaBannerBlock }) {
  return (
    <section className="bg-brand-900 py-section text-center text-white">
      <div className="mx-auto max-w-3xl px-4">
        {block.eyebrow ? (
          <p className="text-sm font-semibold uppercase tracking-wide text-gold-400">
            {block.eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 text-3xl font-bold">{block.heading}</h2>
        {block.body ? <p className="mt-3 text-brand-100">{block.body}</p> : null}
        <Link
          href={block.ctaHref ?? '/lien-he/'}
          className="mt-6 inline-block rounded bg-gold-500 px-6 py-3 font-semibold text-brand-950 hover:bg-gold-400"
        >
          {block.ctaLabel ?? 'Liên hệ ngay'}
        </Link>
      </div>
    </section>
  )
}
