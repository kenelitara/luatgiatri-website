/**
 * Media URL helper. Payload appends the app's trailing slash to generated file
 * URLs (`NEXT_TRAILING_SLASH` from `withPayload`); the Media collection's
 * `afterRead` hook normalises `url` and `sizes.*.url` at the data layer. This
 * helper is the named contract for the same stripping at every consumer —
 * values that bypass the hook (raw doc shapes, cached payloads) and M3's
 * og:image / JSON-LD paths go through it.
 */
export function mediaUrl(media?: { url?: string | null } | number | null): string | null {
  if (!media || typeof media !== 'object') return null
  const url = media.url
  if (!url) return null
  return url.replace(/\/+$/, '')
}
