import Image from 'next/image'
import type { Page } from '@/payload-types'

type CustomerLogoStripBlock = Extract<
  NonNullable<Page['layout']>[number],
  { blockType: 'customerLogoStrip' }
>

export function CustomerLogoStripView({ block }: { block: CustomerLogoStripBlock }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid grid-cols-2 items-center gap-6 md:grid-cols-6">
        {block.logos?.map((logo, i) => {
          const img = typeof logo.image === 'object' ? logo.image : null
          return img?.url ? (
            <Image
              key={i}
              src={img.url}
              alt={img.alt}
              width={140}
              height={60}
              className="object-contain opacity-70"
            />
          ) : null
        })}
      </div>
    </section>
  )
}
