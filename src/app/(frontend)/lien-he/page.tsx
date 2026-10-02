import { Fragment } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/JsonLd'
import { FormEmbedView } from '@/components/blocks/views/FormEmbedView'
import { ContactChannels } from '@/components/lien-he/ContactChannels'
import { LocationCard } from '@/components/lien-he/LocationCard'
import { getPage } from '@/lib/getPage'
import { buildMetadata, DEFAULT_BRAND } from '@/lib/metadata'
import { pageSchemas } from '@/lib/schema-adapters'
import { pageMetadata } from '@/lib/seo-helpers'
import { getSiteSettings } from '@/lib/site'
import type { Page } from '@/payload-types'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getPage('lien-he'), getSiteSettings()])
  if (!page) return buildMetadata({ title: DEFAULT_BRAND, path: '/lien-he/', branded: false })
  return buildMetadata(pageMetadata(page, settings))
}

type FormEmbedBlock = Extract<NonNullable<Page['layout']>[number], { blockType: 'formEmbed' }>

/**
 * The ONE bespoke page layout in the site (client request, 2026-10-02).
 *
 * `/lien-he/` is genuinely unique: its content is not prose, it is contact
 * channels plus a location and the lead form. It therefore renders a
 * purpose-built layout instead of `<PageShell>`, which would simply map the
 * layout blocks — but it keeps BOTH of PageShell's structural promises, which
 * the gates assert:
 *
 *   1. `<JsonLd data={pageSchemas(page)} />` — the page's breadcrumb/structured
 *      data (dropping it would silently remove it from the served HTML).
 *   2. the page's ONLY `<h1>`, from `page.primaryHeading` (spec §6.4;
 *      `heading-discipline.spec.ts`). Every other heading here is an `<h2>`.
 *
 * The `cta_banner` and `rich_text` blocks were removed from the DB and the seed
 * fixture (the CTA linked to this very page; the richText was the contact info
 * now rendered by the cards). The remaining `formEmbed` block still comes from
 * the CMS — rendered through `<FormEmbedView variant="plain">` because the
 * client asked for the form to sit beside the map in one row, which the block's
 * own full-width tinted band cannot do inside a grid column. The block's
 * default appearance (what `<Renderer>` uses everywhere else) is untouched.
 *
 * COLUMN ORDER: the map card is FIRST in the DOM, so it is the left column on
 * desktop and it stacks above the form on mobile — the same order in both
 * cases, so focus order always matches what is on screen. To put the form first
 * on mobile instead, add `order-2 lg:order-1` to the map column and
 * `order-1 lg:order-2` to the form column.
 *
 * `getSiteSettings()` is called ONCE here and passed down — the sections never
 * fetch (the metadata pass reads it too, but that is a separate render).
 */
export default async function LienHePage() {
  const [page, settings] = await Promise.all([getPage('lien-he'), getSiteSettings()])
  if (!page) notFound()

  const formBlocks = (page.layout ?? []).filter(
    (block): block is FormEmbedBlock => block.blockType === 'formEmbed',
  )

  return (
    <article>
      <JsonLd data={pageSchemas(page)} />
      <h1 className="mx-auto max-w-6xl px-4 pt-10 pb-2 text-center text-3xl font-bold text-brand-900">
        {page.primaryHeading}
      </h1>
      <ContactChannels settings={settings} />
      {/* Map + form side by side (client refinement, 2026-10-02). `items-stretch`
          makes the map card take the form's height; the map area inside it is
          `flex-1` with a `min-h`, so it never collapses. */}
      <section className="py-section">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
            <LocationCard settings={settings} />
            <div className="flex flex-col rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
              {formBlocks.map((block, i) => (
                <Fragment key={i}>
                  <FormEmbedView block={block} variant="plain" />
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>
    </article>
  )
}
