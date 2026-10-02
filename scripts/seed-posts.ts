/**
 * scripts/seed-posts.ts — authored Posts fixtures → Payload Local API.
 *
 * Reads every non-underscore JSON in `seed/content/posts/` and upserts it into
 * the `posts` collection by slug (idempotent: a re-run updates in place, it
 * never duplicates). Kept separate from `scripts/seed.ts` (which seeds the
 * `pages` collection from the flat `seed/content/*.json` files) so the authored
 * article fixtures live in their own folder and cannot be mistaken for pages.
 *
 * IMPORTANT — content law (spec §3.2 is "port copy verbatim, invent no legal or
 * pricing copy"). These three posts are the ONE deliberate exception: they are
 * AI-compiled placeholder articles about recent business-registration
 * instruments, NOT ported from the live site and NOT yet reviewed by the firm's
 * lawyers. They are seeded `_status: "published"` (so the client sees a complete
 * site) and every claim is anchored to its instrument by number + effective
 * date. The review requirement is recorded in `seed/content/_notes.json`
 * (`authoredLegalPosts`) and in AGENTS.md — that is the ONLY record, since the
 * posts deliberately carry no in-body review banner.
 *
 * Fixture indirection handled here:
 *  - `{ "mediaRef": "<url>", "alt": "…" }` → the media id recorded by
 *    `pnpm seed:media` in `seed/content/_media-map.json` (unmapped → null).
 *  - `author` is an Author SLUG (resolved to an id here, like teamGrid.members
 *    in seed.ts) and `categories` are Category SLUGS.
 *  - the fixture's `_status` is passed through verbatim.
 *
 * Env: Node's built-in `process.loadEnvFile()` loads .env — no dotenv needed.
 */
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

type MediaMap = Record<string, number | '__FAILED__'>

type PostFixture = {
  title: string
  slug: string
  primaryHeading: string
  excerpt?: string
  heroImage?: { mediaRef: string; alt?: string } | null
  author: string
  categories?: string[]
  publishedAt: string
  body: unknown
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

  const contentDir = join(process.cwd(), 'seed/content')
  const postsDir = join(contentDir, 'posts')
  const files = (await readdir(postsDir)).filter((f) => f.endsWith('.json') && !f.startsWith('_'))
  if (!files.length) {
    console.log('seed-posts: no fixtures in seed/content/posts')
    process.exit(0)
  }

  let mediaMap: MediaMap = {}
  try {
    mediaMap = JSON.parse(await readFile(join(contentDir, '_media-map.json'), 'utf8')) as MediaMap
  } catch {
    // no media map yet — every mediaRef resolves to null
  }

  const authorIds = new Map<string, number>()
  for (const a of (await payload.find({ collection: 'authors', limit: 100 })).docs) {
    authorIds.set(String(a.slug), a.id)
  }
  const categoryIds = new Map<string, number>()
  for (const c of (await payload.find({ collection: 'categories', limit: 100 })).docs) {
    categoryIds.set(String(c.slug), c.id)
  }

  const resolveMedia = (url: string): number | null => {
    const mapped = mediaMap[url]
    return typeof mapped === 'number' ? mapped : null
  }

  // Same recursive mediaRef swap as scripts/seed.ts.
  const transform = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(transform)
    if (node && typeof node === 'object') {
      const obj = node as Record<string, unknown>
      if (typeof obj.mediaRef === 'string') return resolveMedia(obj.mediaRef)
      const out: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(obj)) out[key] = transform(value)
      return out
    }
    return node
  }

  let failures = 0
  for (const file of files) {
    const fixture = JSON.parse(await readFile(join(postsDir, file), 'utf8')) as PostFixture

    const authorId = authorIds.get(fixture.author)
    if (authorId === undefined) throw new Error(`author not found: ${fixture.author}`)
    const catIds = (fixture.categories ?? []).map((slug) => {
      const id = categoryIds.get(slug)
      if (id === undefined) throw new Error(`category not found: ${slug} (post ${fixture.slug})`)
      return id
    })

    const data = {
      ...(transform(fixture) as Record<string, unknown>),
      author: authorId,
      categories: catIds,
    } as never

    // `draft: true` so a post created as a draft by an earlier run is still
    // found and updated (the normal `find` is published-only).
    const existing = await payload.find({
      collection: 'posts',
      where: { slug: { equals: fixture.slug } },
      draft: true,
      limit: 1,
    })

    try {
      if (existing.docs.length) {
        await payload.update({ collection: 'posts', id: existing.docs[0].id, data })
        console.log(`updated post: ${fixture.slug}`)
      } else {
        await payload.create({ collection: 'posts', data })
        console.log(`created post: ${fixture.slug}`)
      }
    } catch (err) {
      failures++
      console.error(`FAILED post ${fixture.slug}:`, err)
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
