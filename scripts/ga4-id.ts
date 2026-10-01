/**
 * scripts/ga4-id.ts — set or clear the GA4 measurement id in SiteSettings.
 *
 *   pnpm ga4:set G-TEST123   # write the id
 *   pnpm ga4:clear           # empty it (back to NULL)
 *
 * The id lives in the `site-settings` global, which is the website's ONLY GA4
 * source: the (frontend) layout reads it server-side and passes it to
 * <ConsentBanner> (no env var, no build arg — Task 12 revised). There is
 * deliberately no GA4 id in `scripts/seed.ts`, because the seed also runs in
 * production and would switch analytics on for real traffic.
 *
 * WHY A SCRIPT AND NOT A MANUAL ADMIN STEP: the banner's presence is baked into
 * the PRERENDERED HTML, so for a BUILD to carry the id it must already be in the
 * database before `pnpm build`. The e2e gate procedure is therefore:
 *   pnpm ga4:set G-TEST123  →  pnpm build  →  next start -p 3100  →  pnpm e2e
 *   →  pnpm ga4:clear
 * Use a fake id (G-TEST…) for tests; a real one enables analytics for all
 * visitors.
 *
 * Env: Node's built-in `process.loadEnvFile()` loads .env — no dotenv needed.
 * The Payload config is imported DYNAMICALLY, after the env load, because
 * `payload.config.ts` reads `DATABASE_URI` at module-evaluation time (same
 * pattern as `scripts/seed.ts` / `scripts/reindex-search.ts`). The Payload DB
 * pool keeps the process alive, so `process.exit()` ends the run.
 */

try {
  process.loadEnvFile()
} catch {
  // no .env present — rely on the ambient environment
}

async function main() {
  const mode = process.argv[2]
  if (mode !== 'set' && mode !== 'clear') {
    console.error('usage: pnpm ga4:set <id>  |  pnpm ga4:clear')
    process.exit(1)
  }
  const id = mode === 'set' ? process.argv[3] : null
  if (mode === 'set' && !id) {
    console.error('pnpm ga4:set requires an id, e.g. pnpm ga4:set G-TEST123')
    process.exit(1)
  }

  const { default: configPromise } = await import('@payload-config')
  const { getPayload } = await import('payload')
  const payload = await getPayload({ config: configPromise })

  // Local API → overrideAccess defaults to true, so the global's isAdmin
  // update rule is not in the way here (this runs without a logged-in user).
  await payload.updateGlobal({ slug: 'site-settings', data: { ga4Id: id } })
  console.log(id ? `ga4Id set to ${id}` : 'ga4Id cleared (NULL)')
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
