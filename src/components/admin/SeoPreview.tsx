'use client'

import { useFormFields } from '@payloadcms/ui'

const TITLE_MIN = 50
const TITLE_MAX = 60
const DESC_MIN = 150
const DESC_MAX = 160

/**
 * Colour for a counter, as a hex string. Inline styles are used instead of
 * Tailwind utility classes on purpose: the Payload admin route group imports
 * only `@payloadcms/next/css` + `src/app/(payload)/custom.scss`, so Tailwind
 * utilities are not part of the admin bundle (they would silently do nothing).
 */
function counterColor(len: number, min: number, max: number): string {
  if (len === 0) return '#9ca3af' // gray-400
  if (len < min) return '#d97706' // amber-600
  if (len > max) return '#dc2626' // red-600
  return '#16a34a' // green-600
}

/**
 * SERP preview + live character counters for the `seo` group (spec §6.2).
 *
 * Mounted as a `ui` field at the top of the `seo` group (see
 * `src/payload/fields/seo.ts`). Payload's form state is a FLAT map keyed by
 * dotted field path (`FormState = { [path: string]: FieldState }` — see
 * `getFieldPaths` in `payload/dist/fields/`), so sibling values are read as
 * `fields['seo.metaTitle']`, not `fields.seo.metaTitle`.
 */
export function SeoPanel() {
  const title = useFormFields(([fields]) => (fields?.['seo.metaTitle']?.value as string) ?? '')
  const desc = useFormFields(([fields]) => (fields?.['seo.metaDescription']?.value as string) ?? '')
  const heading = useFormFields(([fields]) => (fields?.['primaryHeading']?.value as string) ?? '')

  const serpTitle = title || heading || '(chưa có tiêu đề)'
  const serpDesc = desc || '(chưa có mô tả)'

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 12,
          background: '#fff',
        }}
      >
        <div style={{ color: '#1a0dab', fontSize: 18, lineHeight: 1.3 }}>{serpTitle}</div>
        <div style={{ color: '#006621', fontSize: 13 }}>luatgiatri.com</div>
        <div style={{ color: '#545454', fontSize: 13 }}>{serpDesc}</div>
      </div>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '8px 0 0',
          fontSize: 12,
          display: 'flex',
          gap: 16,
        }}
      >
        <li style={{ color: counterColor(title.length, TITLE_MIN, TITLE_MAX) }}>
          Tiêu đề: {title.length}/{TITLE_MAX} ({TITLE_MIN}–{TITLE_MAX})
        </li>
        <li style={{ color: counterColor(desc.length, DESC_MIN, DESC_MAX) }}>
          Mô tả: {desc.length}/{DESC_MAX} ({DESC_MIN}–{DESC_MAX})
        </li>
      </ul>
    </div>
  )
}
