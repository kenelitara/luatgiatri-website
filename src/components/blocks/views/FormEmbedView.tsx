import { Heading } from '@/components/blocks/Heading'
import { LeadForm } from '@/components/LeadForm'
import type { Page } from '@/payload-types'

type FormEmbedBlock = Extract<NonNullable<Page['layout']>[number], { blockType: 'formEmbed' }>

/**
 * Lead-capture block (spec §8). The heading is this block's own <h2> (spec
 * §6.4); the form itself emits no headings.
 */
export function FormEmbedView({ block }: { block: FormEmbedBlock }) {
  return (
    <section className="bg-brand-50 px-section">
      <div className="mx-auto max-w-3xl px-4">
        <Heading>{block.heading}</Heading>
        {block.intro ? <p className="mb-6 text-brand-900">{block.intro}</p> : null}
        <LeadForm />
      </div>
    </section>
  )
}
