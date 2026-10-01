import type { CollectionAfterChangeHook } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import { searchableText } from '@/lib/search-text'

type WritableTable = 'pages' | 'posts' | 'categories'

/**
 * Minimal structural view of the postgres adapter's transaction plumbing
 * (`sessions`/`drizzle` are real properties — see
 * `@payloadcms/db-postgres/dist/index.js` for the adapter literal and
 * `@payloadcms/drizzle/dist/utilities/getTransaction.js` for the resolution
 * this mirrors). Typed structurally so the hook does not depend on the
 * adapter's full generic type.
 */
type TxAdapter = {
  drizzle: { execute: (query: unknown) => Promise<unknown> }
  sessions: Record<string, { db: { execute: (query: unknown) => Promise<unknown> } } | undefined>
}

/**
 * afterChange: write `search_vector = to_tsvector('simple', unaccent(text))`.
 *
 * Raw SQL because `tsvector` has no Payload field type.
 *
 * CRITICAL — the write runs on the request's TRANSACTION session, not on a
 * separate pool connection. Payload runs `afterChange` INSIDE the write
 * transaction (`updateByID` commits only after the document hooks), so the
 * row is already locked by this transaction. A query on a DIFFERENT
 * connection (e.g. M1's `getDbPool()`) blocks forever on that row lock — an
 * application-level deadlock Postgres cannot detect (the transaction holder
 * is not itself waiting on a DB lock). That hung every create/update in
 * testing. Using the same session makes the vector commit atomically with
 * the content: a rolled-back write rolls back the vector too — no drift.
 *
 * Never fails the content write: a DB error is logged and the doc returned
 * unchanged (search degrades to an empty vector; `pnpm reindex` repairs it).
 * `unaccent` makes search diacritic-insensitive; the query layer applies
 * `unaccent()` on BOTH sides (spec §7) so `ke toan` matches `kế toán`.
 */
export const writeSearchVector =
  (table: WritableTable): CollectionAfterChangeHook =>
  async ({ doc, req }) => {
    try {
      const text = searchableText(doc as Record<string, unknown>)
      const adapter = req.payload.db as unknown as TxAdapter
      const session = req.transactionID
        ? (adapter.sessions[await req.transactionID]?.db ?? adapter.drizzle)
        : adapter.drizzle
      await session.execute(
        sql`UPDATE ${sql.identifier(table)} SET search_vector = to_tsvector('simple', unaccent(${text})) WHERE id = ${doc.id}`,
      )
    } catch (err) {
      console.error(`[search-vector] ${table} id=${doc.id} failed:`, err)
    }
    return doc
  }
