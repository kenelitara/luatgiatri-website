import type { MetadataRoute } from 'next'
import { getBaseUrl, isStaging } from '@/lib/site-env'

// Evaluated at build time: SITE_ENV is a build arg, not a runtime switch.
// Staging images ship Disallow: /.
export default function robots(): MetadataRoute.Robots {
  if (isStaging()) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    }
  }
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/media/'], // media files serve under the API route in
        // Payload 3.90.2 embedded (/api/media/file/<filename>) — the Allow wins
        // by longest-path precedence, keeping images crawlable while REST stays
        // disallowed
        // `/next` is the Live Preview entry/exit tree (`/next/preview`,
        // `/next/exit-preview`) — internal to the admin preview flow, never a
        // crawl target. Draft-mode CONTENT is additionally kept out of the
        // index by the `X-Robots-Tag: noindex` header (next.config.ts `headers`)
        // that rides on any request carrying the draft-mode bypass cookie.
        disallow: ['/admin', '/api/', '/next'],
      },
    ],
    sitemap: `${getBaseUrl()}/sitemap.xml`,
  }
}
