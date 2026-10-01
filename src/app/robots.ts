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
        disallow: ['/admin', '/api/'],
      },
    ],
    sitemap: `${getBaseUrl()}/sitemap.xml`,
  }
}
