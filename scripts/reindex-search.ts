/**
 * scripts/reindex-search.ts — backfill `search_vector` for every published doc.
 *
 * The `afterChange` hook keeps the vector current on writes; this script
 * repairs the initial state (and any drift) by walking pages, posts and
 * categories and rebuilding each vector with the SAME expression as the hook:
 * `to_tsvector('simple', unaccent(searchableText(doc)))`. Run it after seeding
 * or after any bulk write that bypassed the Local API.
 *
 * Env: Node's built-in `process.loadEnvFile()` loads .env — no dotenv needed.
 * The Payload config is imported DYNAMICALLY, after the env load, because
 * `payload.config.ts` reads `DATABASE_URI` at module-evaluation time (same
 * pattern as `scripts/seed.ts`). The Payload DB pool keeps the process alive,
 * so `process.exit()` ends the run.
 */
import { getDbPool } from '../src/lib/db'
import { searchableText } from '../src/lib/search-text'

try {
  process.loadEnvFile()
} catch {
  // no .env present — rely on the ambient environment
}

async function main() {
  const { default: configPromise } = await import('@payload-config')
  const { getPayload } = await import('payload')
  const payload = await getPayload({ config: configPromise })
  const pool = getDbPool()
  for (const collection of ['pages', 'posts', 'categories'] as const) {
    const { docs } = await payload.find({ collection, limit: 1000, draft: false })
    for (const doc of docs) {
      const text = searchableText(doc as never)
      await pool.query(
        `UPDATE "${collection}" SET search_vector = to_tsvector('simple', unaccent($1)) WHERE id = $2`,
        [text, doc.id],
      )
    }
    console.log(`reindexed ${docs.length} ${collection}`)
  }
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
