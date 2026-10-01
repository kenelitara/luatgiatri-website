/**
 * scripts/seed.ts — fixtures → Payload Local API (Task 20).
 *
 * Reads every non-underscore JSON in seed/content/ and upserts it into the
 * `pages` collection by slug (idempotent re-runs update in place).
 *
 * Fixture indirection handled here:
 *  - `{ "mediaRef": "<url>", "alt": "…" }` objects are replaced with the media
 *    id recorded by `pnpm seed:media` in seed/content/_media-map.json
 *    (unmapped/failed refs become null — block views guard optional images;
 *    note: hero/servicePair images are schema-required, so a failed download
 *    surfaces as a per-page validation error that is reported, not swallowed).
 *  - `teamGrid.membersBySlug` (author slugs) is resolved to author ids via a
 *    single `authors` query at startup — chosen over hardcoding ids so the
 *    fixtures stay portable across fresh databases.
 *  - fixtures carry `_status: "published"` so draft-enabled pages are visible
 *    to the published-only queries of the public routes (Task 21).
 *
 * Env: Node's built-in `process.loadEnvFile()` loads .env (PAYLOAD_SECRET,
 * DATABASE_URI) — no dotenv dependency.
 */
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

type MediaMap = Record<string, number | '__FAILED__'>

type PageFixture = {
  title: string
  slug: string
  primaryHeading: string
  layout: unknown[]
  serviceMeta?: Record<string, unknown> | null
  _status?: string
}

try {
  process.loadEnvFile()
} catch {
  // no .env present — rely on the ambient environment
}

async function main() {
  // Imported AFTER .env is loaded: payload.config.ts reads DATABASE_URI at
  // module-evaluation time, so a static import would race the env setup.
  const { default: configPromise } = await import('@payload-config')
  const { getPayload } = await import('payload')
  const payload = await getPayload({ config: configPromise })

  const dir = join(process.cwd(), 'seed/content')
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json') && !f.startsWith('_'))

  let mediaMap: MediaMap = {}
  try {
    mediaMap = JSON.parse(await readFile(join(dir, '_media-map.json'), 'utf8')) as MediaMap
  } catch {
    // no media map yet — every mediaRef resolves to null
  }

  // Resolve author slugs once (teamGrid.membersBySlug → relationship ids)
  const authorIds = new Map<string, number>()
  const authors = await payload.find({ collection: 'authors', limit: 100 })
  for (const author of authors.docs) {
    authorIds.set(String(author.slug), author.id)
  }

  const resolveMedia = (url: string): number | null => {
    const mapped = mediaMap[url]
    return typeof mapped === 'number' ? mapped : null
  }

  const transform = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(transform)
    if (node && typeof node === 'object') {
      const obj = node as Record<string, unknown>
      if (typeof obj.mediaRef === 'string') return resolveMedia(obj.mediaRef)
      if (Array.isArray(obj.membersBySlug)) {
        const ids = (obj.membersBySlug as string[]).map((slug) => authorIds.get(slug))
        const missing = (obj.membersBySlug as string[]).filter(
          (slug, i) => ids[i] === undefined,
        )
        if (missing.length) {
          throw new Error(`authors not found for slugs: ${missing.join(', ')}`)
        }
        // keep blockType/heading — only swap the slug list for resolved ids
        const { membersBySlug: _slugs, ...rest } = obj
        const outRest = transform(rest) as Record<string, unknown>
        return { ...outRest, members: ids }
      }
      const out: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(obj)) out[key] = transform(value)
      return out
    }
    return node
  }

  let failures = 0
  for (const file of files) {
    const fixture = JSON.parse(await readFile(join(dir, file), 'utf8')) as PageFixture
    const data = transform(fixture) as never
    const existing = await payload.find({
      collection: 'pages',
      where: { slug: { equals: fixture.slug } },
      limit: 1,
    })

    try {
      if (existing.docs.length) {
        await payload.update({
          collection: 'pages',
          id: existing.docs[0].id,
          data,
        })
      } else {
        await payload.create({ collection: 'pages', data })
      }
      console.log(`seeded page: ${fixture.slug}`)
    } catch (err) {
      failures++
      console.error(`FAILED page ${fixture.slug}:`, err)
    }
  }

  if (failures) process.exit(1)
  // The Payload DB pool keeps the event loop alive — exit explicitly.
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})