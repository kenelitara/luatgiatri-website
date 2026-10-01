import { Heading } from '../Heading'
import type { Page } from '@/payload-types'

type TestimonialsBlock = Extract<NonNullable<Page['layout']>[number], { blockType: 'testimonials' }>

export function TestimonialsView({ block }: { block: TestimonialsBlock }) {
  return (
    <section className="bg-brand-50 py-section">
      <div className="mx-auto max-w-6xl px-4">
        {block.heading ? <Heading>{block.heading}</Heading> : null}
        <div className="grid gap-6 md:grid-cols-2">
          {block.items?.map((item, i) => (
            <figure key={i} className="rounded bg-white p-6 shadow-sm">
              <blockquote className="text-brand-800">“{item.quote}”</blockquote>
              <figcaption className="mt-3 text-sm font-semibold text-brand-900">
                {item.name}
                {item.role ? (
                  <span className="font-normal text-brand-600"> — {item.role}</span>
                ) : null}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
