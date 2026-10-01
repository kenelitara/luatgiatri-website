import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from 'payload'
import {
  categoryChangePaths,
  pageChangePaths,
  postChangePaths,
  relationshipIds,
  relationshipSlugs,
} from '@/lib/revalidate-paths'

/**
 * On-demand revalidation for the public site (spec §6.x): an editor's publish
 * or edit must appear IMMEDIATELY, not after the 60 s ISR window — including
 * the case where the URL was requested BEFORE the page existed and ISR cached
 * the 404 for a minute.
 *
 * Two hazards shape this module; both are verified against the installed
 * `payload@3.90.2` (2026-10-01) and recorded in AGENTS.md:
 *
 * 1. TRANSACTION. `payload/dist/collections/operations/{create,update,delete}.js`
 *    call the document hooks BEFORE `commitTransaction(req)` (create: hooks
 *    ~line 373-398, commit line 421; update: commit line 347; delete: afterDelete
 *    ~line 204, commit line 270). The same holds for globals
 *    (`globals/operations/update.js`: afterChange ~407, commit 424). There is NO
 *    post-commit hook anywhere in `payload/dist` (no `afterCommit`). Purging
 *    inside the hook therefore runs BEFORE the row is visible, and a request
 *    landing in that window re-renders OLD data and caches it for another 60 s.
 *
 *    A naive `setImmediate`/`process.nextTick` deferral does NOT fix this either,
 *    and worse, it breaks the purge outright: Next collects `revalidatePath`
 *    calls in a REQUEST-scoped `workStore.pendingRevalidatedTags` and flushes
 *    them in `executeRevalidates(workStore)` — for a route handler that is
 *    `route-modules/app-route/module.js`'s `resolvePendingRevalidations()`, which
 *    runs in the microtask continuation right after the handler resolves, i.e.
 *    immediately after the COMMIT. A `setImmediate` scheduled from the hook fires
 *    in the NEXT event-loop check phase, i.e. AFTER that flush (measured: tags
 *    recorded, cache never invalidated) — and `process.nextTick` runs even
 *    earlier, always before the COMMIT round-trip.
 *
 *    Mitigation: `after()` from `next/server`. An `after()` task runs when the
 *    request is closed — strictly after the response, hence strictly after the
 *    COMMIT — and Next wraps the whole callback queue in
 *    `withExecuteRevalidates(workStore, …)`
 *    (`server/after/after-context.js`, `runCallbacks()`), so revalidations
 *    performed there ARE flushed. `waitForCommit` is kept as an explicit,
 *    cheap assertion of the invariant.
 *
 * 2. NON-NEXT RUNTIMES. `pnpm seed`, `pnpm reindex`, `pnpm payload migrate`,
 *    `pnpm ga4:*` and the Payload CLI all load `payload.config.ts` → collections
 *    → this module under `tsx`, where `next/cache`/`next/server` do not exist. A
 *    STATIC import would break every one of them. Both imports are therefore
 *    DYNAMIC and guarded — see `getNextApis` — and `after()` itself throws
 *    outside a request scope, so the whole hook degrades to a silent no-op. Same
 *    class of fix as `search-text.ts` living apart from its hook.
 */

type RevalidatePathFn = (path: string, type?: 'layout' | 'page') => void
type AfterFn = (task: () => void | Promise<void>) => void

type NextApis = { after: AfterFn; revalidatePath: RevalidatePathFn }

/** `undefined` = not probed yet, `null` = unavailable in this runtime. */
let cachedNextApis: NextApis | null | undefined

/**
 * Resolve Next's `after` + `revalidatePath` AT CALL TIME, and only when both
 * exist. Returns null outside the Next runtime (CLI, seed/reindex/migrate,
 * vitest), so the hook degrades to a silent no-op instead of throwing
 * `ERR_MODULE_NOT_FOUND` or "static generation store missing".
 */
async function getNextApis(): Promise<NextApis | null> {
  if (cachedNextApis !== undefined) return cachedNextApis
  try {
    const [server, cache] = await Promise.all([import('next/server'), import('next/cache')])
    cachedNextApis =
      typeof server.after === 'function' && typeof cache.revalidatePath === 'function'
        ? { after: server.after, revalidatePath: cache.revalidatePath }
        : null
  } catch {
    cachedNextApis = null
  }
  return cachedNextApis
}

/** Are we being served by Next (as opposed to a tsx script)? Used to gate logs. */
function inNextRuntime(): boolean {
  return typeof process.env.NEXT_RUNTIME === 'string' && process.env.NEXT_RUNTIME.length > 0
}

/**
 * Hard ceiling on the commit barrier. It exists only so a pathologically
 * long-lived transaction cannot pin a pending purge forever; the barrier is
 * expected to clear in microseconds.
 */
const COMMIT_BARRIER_TIMEOUT_MS = 5_000

/**
 * Wait until the write transaction that produced this document is no longer
 * active on `req`.
 *
 * `commitTransaction(req)` is literally
 *
 *     await payload.db.commitTransaction(transactionID)
 *     delete req.transactionID
 *
 * (`payload/dist/utilities/commitTransaction.js`) and `killTransaction` deletes
 * it too — both on the SAME `req` object our hook receives (`req` is destructured
 * straight off `args` in `createOperation`, and the collection hook is invoked
 * with `req: args.req`). So `req.transactionID === undefined` is a precise,
 * post-commit signal: the adapter's COMMIT has been acknowledged and the row is
 * visible to every new snapshot.
 *
 * An `after()` task already runs strictly after the response and therefore after
 * the COMMIT, so this normally returns on its first check. It is kept as an
 * explicit, cheap assertion of the invariant (and covers a client disconnect
 * closing the request early).
 */
async function waitForCommit(req: { transactionID?: unknown }): Promise<void> {
  if (!req.transactionID) return
  const deadline = Date.now() + COMMIT_BARRIER_TIMEOUT_MS
  while (req.transactionID) {
    if (Date.now() >= deadline) {
      console.error('[revalidate] commit barrier timed out; purging anyway')
      return
    }
    await new Promise<void>((resolve) => setImmediate(resolve))
  }
}

/**
 * Fire-and-forget: register an `after()` task that, once the response has closed
 * (and so once the write has committed), purges every path. NEVER awaited by the
 * hook — a hook that awaited the commit would deadlock, because the commit it
 * waits for only happens after the hook returns.
 *
 * `type` MUST stay undefined for record paths. `revalidatePath(p, 'page')`
 * appends `/page` to the tag (`_N_T_/tin-tuc/page`), but the tag an ISR entry
 * actually carries for its own URL is the bare pathname tag
 * (`_N_T_/tin-tuc` — verified in `.next/server/app/<route>.meta`'s
 * `x-next-cache-tags`), so passing a type silently invalidates nothing. Only the
 * globals case needs one: `('/', 'layout')` produces `_N_T_/layout`, the derived
 * root-layout tag every page carries.
 */
function purgeAfterResponse(
  req: { transactionID?: unknown },
  paths: string[],
  type?: 'layout',
): void {
  void (async () => {
    const apis = await getNextApis()
    if (!apis) return // not running under Next — no-op (hazard 2)
    try {
      apis.after(async () => {
        await waitForCommit(req)
        for (const path of paths) {
          try {
            apis.revalidatePath(path, type)
          } catch (err) {
            if (inNextRuntime()) console.error(`[revalidate] ${path} failed:`, err)
          }
        }
      })
    } catch (err) {
      // `after()` throws outside a request scope; inside Next this must not throw.
      if (inNextRuntime()) console.error('[revalidate] after() unavailable:', err)
    }
  })().catch((err) => {
    if (inNextRuntime()) console.error('[revalidate] purge failed:', err)
  })
}

/**
 * Category slugs for a post's `categories` relationship, whatever shape the
 * field came back in. At `depth: 0` Payload hands the hook bare ids, so a
 * lookup on the SAME request transaction is needed to learn the slugs (a SELECT
 * on the transaction's own session — the write-path deadlock of Task 8b was a
 * WRITE on a SECOND connection, which this is not).
 */
async function categorySlugsFor(req: PayloadRequest, value: unknown): Promise<string[]> {
  const populated = relationshipSlugs(value)
  if (populated.length > 0) return populated
  const ids = relationshipIds(value)
  if (ids.length === 0) return []
  try {
    const { docs } = await req.payload.find({
      collection: 'categories',
      where: { id: { in: ids } },
      depth: 0,
      limit: ids.length,
      pagination: false,
      req,
      overrideAccess: true,
    })
    return docs
      .map((doc) => doc.slug)
      .filter((slug): slug is string => typeof slug === 'string' && slug.length > 0)
  } catch {
    // A failed lookup only costs us the category-archive purge; the post itself
    // is still revalidated. Archives heal within the normal ISR window.
    return []
  }
}

const slugOf = (doc: unknown): string | undefined =>
  (doc as { slug?: unknown } | null | undefined)?.slug as string | undefined

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

/** Page created / updated → `/<slug>/` (or `/` for home), its OG card, sitemap. */
export const revalidatePages: CollectionAfterChangeHook = ({ doc, previousDoc, req }) => {
  purgeAfterResponse(req, pageChangePaths(slugOf(doc), slugOf(previousDoc)))
  return doc
}

/** Page deleted → immediate 404 at `/<slug>/` (plus its OG card and sitemap). */
export const revalidatePagesDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
  purgeAfterResponse(req, pageChangePaths(slugOf(doc)))
  return doc
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

/** Post created / updated → the post, `/tin-tuc/`, its OG card, every category
 *  archive it belongs to (old and new), and the sitemap. */
export const revalidatePosts: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const [categorySlugs, previousCategorySlugs] = await Promise.all([
    categorySlugsFor(req, (doc as { categories?: unknown }).categories),
    categorySlugsFor(req, (previousDoc as { categories?: unknown } | undefined)?.categories),
  ])
  purgeAfterResponse(
    req,
    postChangePaths({
      slug: slugOf(doc),
      previousSlug: slugOf(previousDoc),
      categorySlugs,
      previousCategorySlugs,
    }),
  )
  return doc
}

/** Post deleted → immediate 404 at `/tin-tuc/<slug>/` and disappearance from the
 *  index, its archives and the sitemap. */
export const revalidatePostsDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const categorySlugs = await categorySlugsFor(req, (doc as { categories?: unknown })?.categories)
  purgeAfterResponse(req, postChangePaths({ slug: slugOf(doc), categorySlugs }))
  return doc
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

/** Category created / updated → its archive, the news index, the sitemap. */
export const revalidateCategories: CollectionAfterChangeHook = ({ doc, previousDoc, req }) => {
  purgeAfterResponse(req, categoryChangePaths(slugOf(doc), slugOf(previousDoc)))
  return doc
}

/** Category deleted → its archive 404s, the index and sitemap update. */
export const revalidateCategoriesDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
  purgeAfterResponse(req, categoryChangePaths(slugOf(doc)))
  return doc
}

// ---------------------------------------------------------------------------
// Globals
// ---------------------------------------------------------------------------

/**
 * SiteSettings / Navigation → `revalidatePath('/', 'layout')`. These feed the
 * header, footer, `<title>` and JSON-LD of EVERY page, so a broad invalidate is
 * the only correct answer; a per-page list cannot be derived from a global.
 */
export const revalidateGlobals: GlobalAfterChangeHook = ({ req }) => {
  purgeAfterResponse(req, ['/'], 'layout')
}
