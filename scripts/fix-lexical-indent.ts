/**
 * scripts/fix-lexical-indent.ts — repair seeded Lexical `listitem` nodes.
 *
 * Defect (found during the M3 admin-theming verification, recorded in
 * AGENTS.md): the hand-authored fixtures in `seed/content/` wrote `listitem`
 * nodes as `{type, value, version, children}` — without the structural
 * `indent` property that `@lexical/list`'s `ListItemNode.updateFromJSON`
 * feeds to `setIndent()`. `setIndent` rejects anything that is not a
 * `number` (`if (!(typeof indent === 'number')) formatDevErrorMessage(
 * 'Invalid indent value.')`), so Payload's admin editor threw
 * `Error: Invalid indent value.` and its error boundary replaced the
 * rich-text editor with "Something went wrong" — on 4 of the 10 seeded
 * pages. The front end renders these lists fine (the HTML/JSX converters
 * never call `setIndent`), which is why the M2 gate missed it. The canonical
 * editor output has `indent: 0` — a NUMBER (observed by round-tripping a
 * bulleted list through the admin editor and reading the stored JSON back).
 *
 * This script backfills `indent: 0` on every `listitem` node that lacks it
 * (or carries a non-number) across all FOUR affected tables — the live
 * content tables AND their version mirrors, so a version restore can never
 * reintroduce the bug:
 *   pages_blocks_rich_text.body / pages_blocks_faq_items.answer
 *   _pages_v_blocks_rich_text.body / _pages_v_blocks_faq_items.answer
 *
 * Idempotent: a row whose listitems already carry a numeric `indent` is not
 * rewritten. It only adds the structural property — the ported copy is
 * untouched. The fixtures were fixed in lockstep (seed/content/*.json), so a
 * fresh `pnpm seed` produces clean rows too.
 *
 * Env: Node's built-in `process.loadEnvFile()` loads .env (DATABASE_URI) —
 * no dotenv dependency. The Payload DB pool keeps the process alive, so
 * `process.exit()` ends the run (same pattern as scripts/reindex-search.ts).
 */
import { getDbPool } from '../src/lib/db'

try {
  process.loadEnvFile()
} catch {
  // no .env present — rely on the ambient environment
}

/** Recursively add a numeric `indent: 0` to every `listitem` node missing it. Mutates. */
function backfillIndent(node: unknown): boolean {
  let changed = false
  if (Array.isArray(node)) {
    for (const child of node) {
      if (backfillIndent(child)) changed = true
    }
  } else if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    if (obj.type === 'listitem' && typeof obj.indent !== 'number') {
      obj.indent = 0
      changed = true
    }
    for (const value of Object.values(obj)) {
      if (backfillIndent(value)) changed = true
    }
  }
  return changed
}

const TARGETS: ReadonlyArray<readonly [table: string, column: string]> = [
  ['pages_blocks_rich_text', 'body'],
  ['pages_blocks_faq_items', 'answer'],
  ['_pages_v_blocks_rich_text', 'body'],
  ['_pages_v_blocks_faq_items', 'answer'],
]

async function main() {
  const pool = getDbPool()
  let totalChanged = 0
  for (const [table, column] of TARGETS) {
    const { rows } = await pool.query(`SELECT id, "${column}" AS value FROM "${table}"`)
    let changed = 0
    for (const row of rows) {
      if (backfillIndent(row.value)) {
        await pool.query(`UPDATE "${table}" SET "${column}" = $1::jsonb WHERE id = $2`, [
          JSON.stringify(row.value),
          row.id,
        ])
        changed++
      }
    }
    totalChanged += changed
    console.log(`patched ${changed}/${rows.length} rows in ${table}`)
  }
  console.log(`done: ${totalChanged} rows updated`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
