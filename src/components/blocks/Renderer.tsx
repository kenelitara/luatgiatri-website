import { Fragment } from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'

import { HeroCarousel } from '@/components/HeroCarousel'
import { CtaBannerView } from './views/CtaBannerView'
import { FeatureGridView } from './views/FeatureGridView'
import { Heading } from './Heading'
import { HeroView } from './views/HeroView'
import { NewsPreviewView } from './views/NewsPreviewView'
import { RichTextView } from './views/RichTextView'
import { ServicePairView } from './views/ServicePairView'
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
    case 'hero':
      return <HeroView block={block} />
    case 'richText':
      return <RichTextView block={block} />
    case 'servicePair':
      return <ServicePairView block={block} />
    case 'featureGrid':
      return <FeatureGridView block={block} />
    case 'ctaBanner':
      return <CtaBannerView block={block} />
    case 'newsPreview':
      return <NewsPreviewView block={block} />
    case 'heroCarousel': {
      const slides = (block.slides ?? []).map((s) => ({
        image: typeof s.image === 'object' && s.image !== null ? s.image : { url: '', alt: '' },
        headline: s.headline,
        subheadline: s.subheadline,
        ctaLabel: s.ctaLabel,
        ctaHref: s.ctaHref,
      }))
      return slides.length ? (
        <HeroCarousel slides={slides} intervalMs={block.intervalMs ?? 6000} />
      ) : null
    }
    case 'faq':
      // Kept inline until Task 19 extracts FaqView — the Renderer heading
      // tests assert this markup renders (regression guard).
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
      // Remaining blocks get full components in Task 19. Until then
      // render nothing rather than wrong markup — never emit untested
      // structure for content blocks.
      return null
  }
}
