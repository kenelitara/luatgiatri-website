'use client'

import { useEffect, useState } from 'react'

// GA4 sets cookies, so under Nghị định 13 (spec §9) nothing may load before the
// visitor consents: this banner asks, and the gtag scripts are injected only
// after "Đồng ý" — no consent, no script.
//
// `ga4Id` is a BUILD-TIME constant. `process.env.NEXT_PUBLIC_*` is inlined by
// `pnpm build` (see the Task 12 note in AGENTS.md), so changing the measurement
// id needs a rebuild — editing it in the admin does nothing.
//
// The `getElementById('ga4-script')` guard makes the injection idempotent, which
// is what keeps React StrictMode's double-invoked mount effect from loading GA4
// twice. The markup, the `lg_consent` key and the `ga4-script` element id are
// fixed by the plan — Task 14's Playwright test asserts them; do not rename.

const KEY = 'lg_consent'

// Storage is not always available: when site data is blocked (sandboxed
// iframes/webviews, storage disabled) `window.localStorage` throws
// `SecurityError`. This runs in a passive effect, React 19 does not swallow
// effect errors, and the layout has no error boundary — so an unguarded read
// would unmount the root and blank the entire public site. Consent simply
// degrades to in-memory for the session instead: an analytics banner must never
// be able to break the site.
function readConsent(): 'accepted' | 'declined' | null {
  try {
    const saved = window.localStorage.getItem(KEY)
    return saved === 'accepted' || saved === 'declined' ? saved : null
  } catch {
    return null
  }
}

function writeConsent(v: 'accepted' | 'declined') {
  try {
    window.localStorage.setItem(KEY, v)
  } catch {
    // In-memory only for this session — the banner still dismisses on click.
  }
}

export function ConsentBanner({ ga4Id }: { ga4Id?: string }) {
  const [state, setState] = useState<'unset' | 'accepted' | 'declined'>('unset')

  useEffect(() => {
    const saved = readConsent()
    if (saved) setState(saved)
  }, [])

  useEffect(() => {
    if (state !== 'accepted' || !ga4Id) return
    if (document.getElementById('ga4-script')) return
    const s = document.createElement('script')
    s.id = 'ga4-script'
    s.async = true
    s.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`
    document.head.appendChild(s)
    const inline = document.createElement('script')
    inline.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}');`
    document.head.appendChild(inline)
  }, [state, ga4Id])

  if (!ga4Id || state !== 'unset') return null

  const decide = (v: 'accepted' | 'declined') => {
    writeConsent(v)
    setState(v)
  }

  return (
    <div role="dialog" aria-label="Thông báo cookie" className="fixed inset-x-0 bottom-0 z-50 bg-brand-950 px-4 py-4 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm">
          Trang web dùng cookie để đo lường truy cập. Bạn có thể đồng ý hoặc từ chối; từ chối sẽ không tải Google Analytics.
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={() => decide('declined')} className="rounded border border-white/40 px-4 py-2 text-sm">
            Từ chối
          </button>
          <button type="button" onClick={() => decide('accepted')} className="rounded bg-gold-500 px-4 py-2 text-sm font-semibold text-brand-950">
            Đồng ý
          </button>
        </div>
      </div>
    </div>
  )
}
