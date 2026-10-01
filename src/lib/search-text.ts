import { lexicalText } from '@/lib/seo-helpers'

/**
 * The text a record is searchable by: its title, heading, excerpt/name, and
 * the Lexical `body` (spec §7).
 *
 * `doc.body` is the Payload richText ENVELOPE `{ root: { type: 'root',
 * children: […] } }` — the envelope itself has neither `.text` nor
 * `.children`, so a naive walk of it returns `''` for every doc (the exact
 * M3 Task 4 bug in `lexicalText`). `lexicalText` unwraps `body.root ?? body`,
 * so passing the raw `doc.body` here is correct; the envelope shape is
 * unit-tested below.
 *
 * Split out of `src/payload/hooks/searchVector.ts` (M2 Task 18 reasoning):
 * the hook module imports runtime `pg` (via `@/lib/db`), and keeping the pure
 * text builder in `@/lib` lets the test import it without dragging the DB
 * layer (or Payload) into the vitest graph. Both the hook and
 * `scripts/reindex-search.ts` import it from here.
 */
export function searchableText(doc: Record<string, unknown>): string {
  const parts: string[] = []
  for (const key of ['title', 'primaryHeading', 'excerpt', 'name']) {
    if (typeof doc[key] === 'string') parts.push(doc[key] as string)
  }
  // A large cap: lexicalText's second arg is the char cap (it exists for meta
  // descriptions); the search text wants the whole body, not 160 chars.
  if (doc.body) parts.push(lexicalText(doc.body, Number.MAX_SAFE_INTEGER))
  return parts.join(' \n ').replace(/\s+/g, ' ').trim()
}
