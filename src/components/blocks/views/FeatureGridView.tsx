import { Heading } from '../Heading'
import type { Page } from '@/payload-types'

type FeatureGridBlock = Extract<NonNullable<Page['layout']>[number], { blockType: 'featureGrid' }>

export function FeatureGridView({ block }: { block: FeatureGridBlock }) {
  return (
    <section className="bg-brand-50 py-section">
      <div className="mx-auto max-w-6xl px-4">
        {block.heading ? <Heading>{block.heading}</Heading> : null}
        <div className="grid gap-6 md:grid-cols-3">
          {block.items?.map((item, i) => (
            <div key={i} className="rounded bg-white p-6 shadow-sm">
              <Heading level={3}>{item.title}</Heading>
              <p className="text-sm leading-6 text-brand-800">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
