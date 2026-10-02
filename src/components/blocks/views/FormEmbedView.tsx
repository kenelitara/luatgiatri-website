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
    // `py-section` (= --spacing-section, 4rem) is the project's vertical rhythm,
    // shared by the other tinted-background blocks (featureGrid, testimonials,
    // ctaBanner). This block carried `px-section` instead — horizontal padding
    // only — so the bg-brand-50 band had ZERO vertical padding and the content
    // touched its top and bottom edges. Measured on /lien-he/: padding-top/bottom
    // were 0px against a sibling's 64px. `px-section` also added 64px of inline
    // padding no sibling has; the inner `px-4` wrapper handles the gutters.
    <section className="bg-brand-50 py-section">
      <div className="mx-auto max-w-3xl px-4">
        <Heading>{block.heading}</Heading>
        {block.intro ? <p className="mb-6 text-brand-900">{block.intro}</p> : null}
        <LeadForm />
      </div>
    </section>
  )
}
