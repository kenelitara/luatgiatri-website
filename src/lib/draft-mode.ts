/**
 * Next Draft Mode + Live Preview path helpers.
 *
 * `draftMode()` is the SUPPORTED way for a server component / route handler to
 * learn whether the current request is a preview request (Next 16.3.6:
 * `draftMode(): Promise<DraftMode>` — `node_modules/next/dist/server/request/draft-mode.d.ts`).
 * Two runtime facts force the guarded, DYNAMIC import used here — the same
 * pattern as `src/payload/hooks/revalidate.ts` (AGENTS.md "Hazard 2"):
 *
 * 1. OUTSIDE A REQUEST it throws. `draftMode()` needs both the work store and
 *    the work-unit store; in a tsx script (seed / reindex / migrate) or under
 *    vitest it hits `throwForMissingRequestStore('draftMode')`. A STATIC import
 *    would also make `next/headers` a hard dependency of every module that
 *    imports `getPage.ts` (page components included) outside the Next runtime.
 * 2. Inside `generateStaticParams` it throws BY DESIGN (case
 *    `'generate-static-params'` in `next/dist/server/request/draft-mode.js`),
 *    and the docker builder stage runs `next build` with no request and no DB.
 *
 * Crucially it does NOT throw during ordinary prerender: the `'prerender'`
 * branch returns an EMPTY draft mode (`createOrGetCachedDraftMode(null, …)`)
 * whose `isEnabled` is `false`. Calling it therefore keeps the published
 * route's ISR / static semantics and leaves the DB-less build untouched — only
 * a request that carries the bypass cookie (set exclusively by the
 * auth-gated preview route) gets `isEnabled === true`, and Next bypasses the
 * cache for it at the routing layer.
 *
 * Fail CLOSED: any unreadable situation returns `false`, so the published
 * filter is always in force.
 */
export async function isDraftModeEnabled(): Promise<boolean> {
  try {
    const { draftMode } = await import('next/headers')
    const { isEnabled } = await draftMode()
    return isEnabled
  } catch {
    return false
  }
}

/**
 * Accept only a site-relative path for a preview / exit redirect. Rejecting
 * protocol-relative (`//evil.test`) and scheme-bearing (`https://…`) targets
 * closes the open-redirect the `path` query parameter would otherwise allow.
 * Returns null when the value is missing or unsafe.
 */
export function resolvePreviewPath(raw: string | null | undefined): string | null {
  if (!raw) return null
  if (!raw.startsWith('/')) return null
  if (raw.startsWith('//')) return null
  if (raw.includes('://')) return null
  if (raw.includes('\\')) return null
  // A control character could smuggle a header/value downstream.
  if (/[\u0000-\u001f\u007f]/.test(raw)) return null
  return raw
}
