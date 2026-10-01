import { Fragment } from 'react'

import { HeroCarousel } from '@/components/HeroCarousel'
import { CtaBannerView } from './views/CtaBannerView'
import { CustomerLogoStripView } from './views/CustomerLogoStripView'
import { FaqView } from './views/FaqView'
import { FeatureGridView } from './views/FeatureGridView'
import { HeroView } from './views/HeroView'
import { NewsPreviewView } from './views/NewsPreviewView'
import { PricingTableView } from './views/PricingTableView'
import { ProcessStepsView } from './views/ProcessStepsView'
import { RichTextView } from './views/RichTextView'
import { ServicePairView } from './views/ServicePairView'
import { TeamGridView } from './views/TeamGridView'
import { TestimonialsView } from './views/TestimonialsView'
import { TokenMatrixView } from './views/TokenMatrixView'
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
        <HeroCarousel
          slides={slides}
          intervalMs={block.intervalMs ?? 6000}
          showOverlay={block.showOverlay ?? false}
        />
      ) : null
    }
    case 'faq':
      return <FaqView block={block} />
    case 'pricingTable':
      return <PricingTableView block={block} />
    case 'tokenMatrix':
      return <TokenMatrixView block={block} />
    case 'testimonials':
      return <TestimonialsView block={block} />
    case 'customerLogoStrip':
      return <CustomerLogoStripView block={block} />
    case 'teamGrid':
      return <TeamGridView block={block} />
    case 'processSteps':
      return <ProcessStepsView block={block} />
    default:
      // All 14 block types have views; this guards against future blocks
      // shipping untested markup — never emit structure for a block type
      // with no view.
      return null
  }
}
