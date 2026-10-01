'use client'

import { useActionState, useEffect, useRef } from 'react'

import { submitLead, type LeadActionResult } from '@/app/actions/lead'

/**
 * The site's only JS island that submits data (spec §8). Posts to the
 * `submitLead` server action — the sole writer of Leads — so no REST endpoint
 * is ever scriptable from the browser. All copy is Vietnamese.
 */
export function LeadForm() {
  // useActionState's action contract is (prevState, formData) — submitLead takes
  // only the FormData, so it is wrapped rather than passed directly.
  const [state, formAction, isPending] = useActionState<LeadActionResult | null, FormData>(
    async (_prev, formData) => submitLead(formData),
    null,
  )

  const sourcePageRef = useRef<HTMLInputElement>(null)
  const sourceUrlRef = useRef<HTMLInputElement>(null)
  const referrerRef = useRef<HTMLInputElement>(null)
  const utmSourceRef = useRef<HTMLInputElement>(null)
  const utmMediumRef = useRef<HTMLInputElement>(null)
  const utmCampaignRef = useRef<HTMLInputElement>(null)

  // Attribution (spec §8) is captured client-side: the URL/UTMs/referrer only
  // exist in the browser, and the hidden inputs must stay hidden until set.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const set = (ref: typeof sourcePageRef, value: string) => {
      if (ref.current) ref.current.value = value
    }
    set(sourcePageRef, window.location.pathname)
    set(sourceUrlRef, window.location.href)
    set(referrerRef, document.referrer)
    set(utmSourceRef, params.get('utm_source') ?? '')
    set(utmMediumRef, params.get('utm_medium') ?? '')
    set(utmCampaignRef, params.get('utm_campaign') ?? '')
  }, [])

  if (state?.ok) {
    return (
      <div
        role="status"
        className="rounded border border-brand-100 bg-brand-50 p-6 text-center text-brand-900"
      >
        <p className="text-lg font-semibold">Cảm ơn bạn đã liên hệ.</p>
        <p className="mt-2">Chúng tôi sẽ liên hệ lại với bạn trong thời gian sớm nhất.</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="mx-auto max-w-xl space-y-4" noValidate>
      {state?.ok === false ? (
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-red-700">
          {state.error}
        </p>
      ) : null}

      <div>
        <label htmlFor="lead-name" className="mb-1 block font-medium text-brand-900">
          Họ tên <span aria-hidden="true">*</span>
        </label>
        <input
          id="lead-name"
          name="name"
          type="text"
          required
          maxLength={120}
          autoComplete="name"
          className="w-full rounded border border-brand-100 px-3 py-2"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="lead-phone" className="mb-1 block font-medium text-brand-900">
            Điện thoại
          </label>
          <input
            id="lead-phone"
            name="phone"
            type="tel"
            maxLength={30}
            autoComplete="tel"
            className="w-full rounded border border-brand-100 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="lead-email" className="mb-1 block font-medium text-brand-900">
            Email
          </label>
          <input
            id="lead-email"
            name="email"
            type="email"
            maxLength={254}
            autoComplete="email"
            className="w-full rounded border border-brand-100 px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label htmlFor="lead-subject" className="mb-1 block font-medium text-brand-900">
          Chủ đề
        </label>
        <input
          id="lead-subject"
          name="subject"
          type="text"
          maxLength={200}
          className="w-full rounded border border-brand-100 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="lead-message" className="mb-1 block font-medium text-brand-900">
          Nội dung
        </label>
        <textarea
          id="lead-message"
          name="message"
          rows={5}
          maxLength={4000}
          className="w-full rounded border border-brand-100 px-3 py-2"
        />
      </div>

      {/* Honeypot — hidden from humans, tempting to bots (spec §8). */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="lead-website">Website</label>
        <input
          id="lead-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
        />
      </div>

      {/* Attribution — filled client-side after hydration. */}
      <input ref={sourcePageRef} type="hidden" name="sourcePage" />
      <input ref={sourceUrlRef} type="hidden" name="sourceUrl" />
      <input ref={referrerRef} type="hidden" name="referrer" />
      <input ref={utmSourceRef} type="hidden" name="utmSource" />
      <input ref={utmMediumRef} type="hidden" name="utmMedium" />
      <input ref={utmCampaignRef} type="hidden" name="utmCampaign" />

      <div className="flex items-start gap-2">
        <input
          id="lead-consent"
          name="consent"
          type="checkbox"
          required
          className="mt-1 h-4 w-4 shrink-0"
        />
        <label htmlFor="lead-consent" className="text-sm text-brand-900">
          Tôi đồng ý để Luật Gia Trí xử lý dữ liệu cá nhân tôi cung cấp nhằm mục đích tư vấn và liên
          hệ theo{' '}
          <a href="/chinh-sach-bao-mat/" className="underline hover:text-brand-700">
            Chính sách bảo mật
          </a>
          . <span aria-hidden="true">*</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-gold-500 px-6 py-3 font-semibold text-brand-950 hover:bg-gold-400 disabled:opacity-60"
      >
        {isPending ? 'Đang gửi…' : 'Gửi liên hệ'}
      </button>
    </form>
  )
}
