'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * The Live Preview indicator + refresh bridge, rendered ONLY while Next Draft
 * Mode is on (the `(frontend)` root layout reads `draftMode().isEnabled` and
 * mounts this conditionally). A normal visitor therefore never gets the bar or
 * the message listener — nothing about the public site changes.
 *
 * It does two jobs, both from Payload's Live Preview contract
 * (`@payloadcms/ui/dist/elements/LivePreview/Window/index.js`):
 *
 * 1. HANDSHAKE. The admin only starts posting events into the iframe once it
 *    believes the iframe is ready; the iframe announces that with a
 *    `{ type: 'payload-live-preview', ready: true }` message to its parent.
 * 2. REFRESH. On a document event (Save / Save draft) the admin posts
 *    `{ type: 'payload-document-event' }`; we call `router.refresh()` so the
 *    server component re-runs — and, because this request carries the draft
 *    bypass cookie, re-reads the freshly saved draft from Payload.
 *
 * NOTE (honest limitation): Payload 3.90.2 has no autosave on these
 * collections, so an UNSAVED keystroke is not reflected — the preview updates
 * when the editor saves. Payload's fully-live mode needs its client-side
 * `useLivePreview` hook (`@payloadcms/live-preview-react`, not installed) which
 * renders the page from posted form data; that would mean a client-side block
 * renderer, which is out of scope here.
 */
export function DraftPreviewBar() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data as { type?: unknown } | null
      if (!data || typeof data !== 'object') return
      if (data.type === 'payload-document-event') router.refresh()
    }

    window.addEventListener('message', handleMessage)

    // Announce readiness (once now, once shortly after in case the admin's
    // listener attaches late).
    const announce = () =>
      window.parent?.postMessage(
        { type: 'payload-live-preview', ready: true },
        window.location.origin,
      )
    announce()
    const timer = window.setTimeout(announce, 500)

    return () => {
      window.removeEventListener('message', handleMessage)
      window.clearTimeout(timer)
    }
  }, [router])

  const exitHref = `/next/exit-preview/?path=${encodeURIComponent(pathname || '/')}`

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-[9999] flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-brand-950 px-4 py-2 text-center text-sm text-white shadow-lg"
    >
      <span className="font-medium">
        Đang xem trước bản nháp — nội dung chưa được xuất bản
      </span>
      {/* A plain <a>, not next/link: prefetching the exit URL would clear the
          draft cookie before the editor actually clicks it. */}
      <a
        href={exitHref}
        className="rounded-full bg-gold-500 px-3 py-1 font-semibold text-brand-950 hover:bg-gold-400"
      >
        Thoát xem trước
      </a>
    </div>
  )
}
