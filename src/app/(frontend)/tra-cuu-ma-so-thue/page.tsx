import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Heading } from '@/components/blocks/Heading'
import { formatViDate } from '@/lib/date'
import { buildMetadata } from '@/lib/metadata'
import { isValidTaxCode, normalizeTaxCode } from '@/lib/tax-code'
import { lookupTaxCode, taxLookupIpHash, type TaxLookupOutcome } from '@/lib/tax-lookup'
import { taxSourceUrl } from '@/lib/tax-lookup-parse'

/**
 * Tax-code business lookup (`/tra-cuu-ma-so-thue/?mst=<code>`).
 *
 * A plain GET form (works without JS, like `/tim-kiem/`). The lookup runs on the
 * SERVER in the request path (force-dynamic) — never at build time, so the
 * DB-less production image is unaffected — and its result is cached in the
 * `tax-lookups` collection so the third-party source is read ONCE per code.
 *
 * Query-parameter result pages are thin/duplicate content, so this route is
 * `noindex, follow` (spec §6.5), exactly like `/tim-kiem/`. In a staging build
 * `buildMetadata` widens that to the wholesale `noindex, nofollow` contract.
 *
 * CLIENT INSTRUCTION (2026-10-02): the data source is NOT named or linked
 * anywhere in the user-visible output — no "Nguồn:" line, no link, no domain in
 * a title/aria-label/alt/metadata string. The reference-only disclaimer is kept
 * as a SEPARATE concern: a wrong address or representative on a law firm's site
 * is a trust problem regardless of who supplied it. The source URL still lives
 * in the database row and the internal lookup result; it is deliberately never
 * rendered.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildMetadata({
  title: 'Tra cứu mã số thuế',
  path: '/tra-cuu-ma-so-thue/',
  noindex: true,
})

/**
 * The user-visible Vietnamese strings. NONE of them names the source.
 *  - `MSG_INVALID`  — the visitor typed something that is not a tax code (no fetch)
 *  - `MSG_NOTFOUND` — the code is valid but there is no record for it
 *  - `MSG_UNAVAIL`  — WE could not load the data right now (network/source/theme)
 *  - `MSG_DISCLAIMER` — reference-only; the firm does not certify the data
 */
const MSG_INVALID =
  'Mã số thuế không hợp lệ. Vui lòng nhập 10 chữ số (doanh nghiệp) hoặc 12 chữ số (hộ kinh doanh), kèm 3 chữ số của đơn vị trực thuộc nếu có (ví dụ: 0319122355, 060091003294 hoặc 0319122355-001).'
const msgNotFound = (mst: string) => `Không tìm thấy thông tin cho mã số thuế ${mst}.`
const msgUnavailable = (mst: string) =>
  `Hiện chưa tải được dữ liệu cho mã số thuế ${mst}. Vui lòng thử lại sau.`
const MSG_DISCLAIMER =
  'Dữ liệu chỉ mang tính tham khảo. Luật Gia Trí không xác nhận tính chính xác của thông tin này.'
const MSG_THROTTLED = 'Bạn đã tra cứu quá nhiều lần. Vui lòng thử lại sau ít phút.'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[190px_1fr] sm:gap-4">
      <dt className="text-sm font-semibold text-brand-600">{label}</dt>
      <dd className="text-sm leading-6 text-brand-900">{value}</dd>
    </div>
  )
}

function ResultCard({ outcome }: { outcome: Extract<TaxLookupOutcome, { status: 'found' }> }) {
  const { record } = outcome
  return (
    <div className="mt-8 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
      <Heading level={2}>{record.name}</Heading>
      <dl className="mt-2 divide-y divide-brand-50">
        <Field label="Mã số thuế" value={record.mst} />
        <Field label="Tên" value={record.name ?? '—'} />
        {record.englishName ? <Field label="Tên giao dịch (tiếng Anh)" value={record.englishName} /> : null}
        {record.address ? <Field label="Địa chỉ" value={record.address} /> : null}
        {record.representative ? <Field label="Người đại diện pháp luật" value={record.representative} /> : null}
        {record.sector ? <Field label="Lĩnh vực chính" value={record.sector} /> : null}
        <Field label="Thời điểm tra cứu" value={formatViDate(outcome.fetchedAt)} />
      </dl>

      {/*
        Registered industries — a native <details> so no client JS is needed (the
        content is already in the DOM; only its visibility changes). A company can
        carry 35 of them, so the list scrolls inside a max-height instead of
        pushing the footer away. <summary> is NOT a heading, so the heading law
        is untouched (the page keeps one <h1> + the company-name <h2>).
      */}
      {record.industries && record.industries.length > 0 ? (
        <details className="mt-4 rounded border border-brand-100 bg-brand-50">
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-brand-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f908a]">
            Ngành nghề kinh doanh ({record.industries.length})
          </summary>
          <div className="max-h-80 overflow-auto border-t border-brand-100 px-4">
            <dl className="divide-y divide-brand-50">
              {record.industries.map((it, i) => (
                <div key={`${it.code}-${i}`} className="grid gap-1 py-2 sm:grid-cols-[80px_1fr] sm:gap-3">
                  <dt className="text-sm font-semibold text-brand-600">{it.code}</dt>
                  <dd className="text-sm leading-6 text-brand-900">{it.name}</dd>
                </div>
              ))}
            </dl>
          </div>
        </details>
      ) : null}

      <p className="mt-4 text-sm leading-6 text-brand-700">{MSG_DISCLAIMER}</p>
    </div>
  )
}

export default async function TaxLookupPage({
  searchParams,
}: {
  searchParams: Promise<{ mst?: string }>
}) {
  const { mst: rawParam } = await searchParams
  const code = normalizeTaxCode(rawParam)
  const hasInput = code.length > 0
  const invalid = hasInput && !isValidTaxCode(code)

  let outcome: TaxLookupOutcome | null = null
  if (hasInput && !invalid) {
    try {
      const h = await headers()
      const ipHash = await taxLookupIpHash(h, process.env.IP_HASH_SALT)
      outcome = await lookupTaxCode(code, ipHash)
    } catch (err) {
      // A DB failure must degrade to the same soft state as an unreachable source.
      console.error('[mst] lookup failed:', { mst: code, err })
      // `source` is internal bookkeeping only — never rendered (client instruction).
      outcome = { status: 'unavailable', source: taxSourceUrl(code), cached: false }
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-section">
      <h1 className="text-3xl font-bold text-brand-900">Tra cứu mã số thuế</h1>
      <p className="mt-2 text-brand-700">
        Nhập mã số thuế của doanh nghiệp hoặc hộ kinh doanh để xem thông tin đăng ký.
      </p>

      <form action="/tra-cuu-ma-so-thue/" method="get" role="search" className="mt-6 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          name="mst"
          defaultValue={rawParam ?? ''}
          placeholder="Ví dụ: 0319122355"
          aria-label="Mã số thuế"
          autoComplete="off"
          inputMode="numeric"
          className="h-11 w-full min-w-0 rounded border border-brand-100 bg-white px-3 text-base text-brand-900 placeholder:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f908a]"
        />
        <button
          type="submit"
          className="h-11 shrink-0 rounded bg-brand-900 px-6 text-sm font-semibold text-white transition hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f908a]"
        >
          Tra cứu
        </button>
      </form>

      {invalid ? (
        <p role="alert" className="mt-6 rounded border border-gold-500/60 bg-gold-100 px-4 py-3 text-sm text-brand-900">
          {MSG_INVALID}
        </p>
      ) : null}

      {!hasInput ? (
        <p className="mt-6 text-sm text-brand-700">
          Mã số thuế gồm 10 chữ số (doanh nghiệp) hoặc 12 chữ số (hộ kinh doanh), kèm 3 chữ số của đơn vị trực thuộc nếu có.
        </p>
      ) : null}

      {/* Not a validation error → the visitor asked us to look something up. */}
      {hasInput && !invalid && outcome ? (
        <>
          {outcome.status === 'found' ? <ResultCard outcome={outcome} /> : null}

          {outcome.status === 'notfound' ? (
            <p role="status" className="mt-6 rounded border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-900">
              {msgNotFound(code)}
            </p>
          ) : null}

          {outcome.status === 'unavailable' ? (
            <p role="status" className="mt-6 rounded border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-900">
              {msgUnavailable(code)}
            </p>
          ) : null}

          {outcome.status === 'throttled' ? (
            <p role="status" className="mt-6 rounded border border-gold-500/60 bg-gold-100 px-4 py-3 text-sm text-brand-900">
              {MSG_THROTTLED}
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
