import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import { resolvePreviewPath } from '@/lib/draft-mode'

/**
 * Live Preview exit — `/next/exit-preview?path=/<target>/`.
 *
 * Clears the Draft Mode bypass cookie and sends the editor back to the page
 * they were previewing (validated site-relative path; `/` when absent), so the
 * published version is shown again. Without this an editor who opened a preview
 * would keep serving themselves drafts.
 *
 * `no-store` on the way out so the redirect can never be cached.
 */
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<Response> {
  const draft = await draftMode()
  draft.disable()
  redirect(resolvePreviewPath(request.nextUrl.searchParams.get('path')) ?? '/')
}
