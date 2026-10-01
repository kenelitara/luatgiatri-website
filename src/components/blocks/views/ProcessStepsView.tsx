import { Heading } from '../Heading'
import type { Page } from '@/payload-types'

type ProcessStepsBlock = Extract<NonNullable<Page['layout']>[number], { blockType: 'processSteps' }>

export function ProcessStepsView({ block }: { block: ProcessStepsBlock }) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-section">
      {block.heading ? <Heading>{block.heading}</Heading> : null}
      <ol className="space-y-4">
        {block.steps?.map((step, i) => (
          <li key={i} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-500 font-bold text-brand-950">
              {i + 1}
            </span>
            <div>
              <Heading level={3}>{step.title}</Heading>
              <p className="text-sm leading-6 text-brand-800">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
