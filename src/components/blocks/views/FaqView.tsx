import { RichText } from '@payloadcms/richtext-lexical/react'
import { Heading } from '../Heading'
import type { Page } from '@/payload-types'

type FaqBlock = Extract<NonNullable<Page['layout']>[number], { blockType: 'faq' }>

export function FaqView({ block }: { block: FaqBlock }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-section">
      {/* heading is optional (string | null) — guard like featureGrid, or a
          null heading ships an empty <h2> no test catches (Task 15 review) */}
      {block.heading ? <Heading>{block.heading}</Heading> : null}
      <div className="divide-y divide-brand-50">
        {block.items?.map((item, i) => (
          <details key={i} className="py-4">
            <summary className="cursor-pointer font-semibold text-brand-900">
              {item.question}
            </summary>
            <div className="prose mt-2">
              <RichText data={item.answer} />
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
