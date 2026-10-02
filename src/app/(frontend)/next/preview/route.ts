import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import { getPayloadClient } from '@/lib/getPayload'
import { resolvePreviewPath } from '@/lib/draft-mode'

/**
 * Live Preview entry point — `/next/preview?path=/<target>/`.
 *
 * `Pages.admin.livePreview.url` / `Posts.admin.livePreview.url` point the admin
 * preview iframe here instead of at the bare public URL, so opening the eye
 * icon for an UNPUBLISHED draft no longer loads a URL that 404s. This route:
 *
 *   1. AUTHORISES the request against the Payload admin session, then
 *   2. turns on Next Draft Mode (which sets the `__prerender_bypass` cookie), then
 *   3. redirects to the target path, where `getPage`/`getPost` now read
 *      `draftMode().isEnabled` and fetch the draft with `draft: true`.
 *
 * WHY A SESSION CHECK AND NOT A URL SECRET (AGENTS.md has the full argument):
 * the admin iframe is SAME-ORIGIN, so the admin's `payload-token` cookie rides
 * along and can be validated server-side. Next's bypass cookie is itself
 * unforgeable — `DraftModeProvider.isEnabled` requires
 * `cookieValue === previewModeId`, and `previewModeId` is the server-only
 * build-time secret `__NEXT_PREVIEW_MODE_ID` (never in the client bundle). So
 * the only way to obtain the cookie is through the gate below; no
 * `PAYLOAD_SECRET`/`PREVIEW_SECRET` needs to appear in a URL or in HTML.
 *
 * A failed authorisation returns BEFORE `draftMode()` is touched, so an
 * unauthorised request can never enable draft mode (asserted in the e2e work).
 */
export const dynamic = 'force-dynamic'

function isStaff(user: { roles?: string[] | null } | null | undefined): boolean {
  return Boolean(user?.roles?.includes('admin') || user?.roles?.includes('editor'))
}

export async function GET(request: NextRequest): Promise<Response> {
  const path = resolvePreviewPath(request.nextUrl.searchParams.get('path'))
  if (!path) {
    return new Response('Đường dẫn xem trước không hợp lệ', { status: 400 })
  }

  let authorised = false
  try {
    const payload = await getPayloadClient()
    const { user } = await payload.auth({ headers: request.headers })
    authorised = isStaff(user as { roles?: string[] | null } | null)
  } catch {
    authorised = false
  }

  if (!authorised) {
    // Draft mode deliberately NOT enabled on a failed authorisation.
    return new Response('Không có quyền xem trước', { status: 403 })
  }

  const draft = await draftMode()
  draft.enable()

  // Redirect to the validated SITE-RELATIVE path (never to a raw query value),
  // which closes the open-redirect. `enable()`'s Set-Cookie rides along on the
  // redirect response.
  redirect(path)
}
