import { Fragment } from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'

import { Heading } from './Heading'
import type { Page } from '@/payload-types'

type Block = NonNullable<Page['layout']>[number]

/**
 * Renders a Pages.layout array. Every block starts at <h2> — the page shell
 * (PageShell) renders the single <h1> from primaryHeading (spec §6.4).
 * Media-bearing blocks receive Payload's image-size URLs via relation data.
 */
export function Renderer({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, i) => (
        <Fragment key={i}>{renderBlock(block)}</Fragment>
      ))}
    </>
  )
}

function renderBlock(block: Block): React.ReactNode {
  switch (block.blockType) {
    case 'richText':
      return (
        <section className="prose">
          <RichText data={block.body} />
        </section>
      )
    case 'servicePair':
      return (
        <section className="grid md:grid-cols-2 gap-8">
          <div>
            {block.image && (
              <img
                src={typeof block.image === 'object' ? (block.image.url ?? '') : ''}
                alt={typeof block.image === 'object' ? block.image.alt : ''}
              />
            )}
          </div>
          <div>
            <Heading>{block.heading}</Heading>
            <div className="prose">
              <RichText data={block.body} />
            </div>
            <ul>
              {block.bullets?.map((b, j) => (
                <li key={j}>✔ {b.item}</li>
              ))}
            </ul>
          </div>
        </section>
      )
    case 'featureGrid':
      return (
        <section>
          {block.heading ? <Heading>{block.heading}</Heading> : null}
          <div className="grid md:grid-cols-3 gap-6">
            {block.items?.map((item, j) => (
              <div key={j}>
                <Heading level={3}>{item.title}</Heading>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </section>
      )
    case 'faq':
      return (
        <section>
          <Heading>{block.heading}</Heading>
          {block.items?.map((item, j) => (
            <details key={j}>
              <summary className="font-semibold">{item.question}</summary>
              <div className="prose">
                <RichText data={item.answer} />
              </div>
            </details>
          ))}
        </section>
      )
    default:
      // Remaining blocks get full components in Tasks 18–19. Until then
      // render nothing rather than wrong markup — never emit untested
      // structure for content blocks.
      return null
  }
}
