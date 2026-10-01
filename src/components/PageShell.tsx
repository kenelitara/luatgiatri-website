import { JsonLd } from '@/components/JsonLd'
import { Renderer } from '@/components/blocks/Renderer'
import { pageSchemas } from '@/lib/schema-adapters'
import type { Page } from '@/payload-types'

/**
 * Renders a Pages record. The page's ONLY <h1> comes from primaryHeading —
 * always visible, always first. Blocks start at <h2> (spec §6.4); the
 * Playwright heading-discipline test fails the build if this breaks.
 * Fixtures set primaryHeading to the page's real H1: home's contains
 * "Luật Gia Trí" (spec §6.9); each service page's carries its keyword.
 */
export function PageShell({ page }: { page: Page }) {
  return (
    <article>
      <JsonLd data={pageSchemas(page)} />
      <h1 className="mx-auto max-w-6xl px-4 pt-8 text-3xl font-bold text-brand-900">
        {page.primaryHeading}
      </h1>
      <Renderer blocks={page.layout ?? []} />
    </article>
  )
}
