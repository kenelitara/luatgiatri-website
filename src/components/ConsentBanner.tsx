'use client'

import { useEffect, useState } from 'react'

const KEY = 'lg_consent'

export function ConsentBanner({ ga4Id }: { ga4Id?: string }) {
  const [state, setState] = useState<'unset' | 'accepted' | 'declined'>('unset')

  useEffect(() => {
    const saved = window.localStorage.getItem(KEY)
    if (saved === 'accepted' || saved === 'declined') setState(saved)
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
    window.localStorage.setItem(KEY, v)
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
