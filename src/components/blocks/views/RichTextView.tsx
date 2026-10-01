import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Page } from '@/payload-types'

type RichTextBlock = Extract<NonNullable<Page['layout']>[number], { blockType: 'richText' }>

export function RichTextView({ block }: { block: RichTextBlock }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <div className="prose">
        <RichText data={block.body} />
      </div>
    </section>
  )
}
