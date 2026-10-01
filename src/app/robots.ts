// Evaluated at build time: SITE_ENV is a build arg, not a runtime switch. Staging images ship Disallow: /.
import type { MetadataRoute } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://luatgiatri.com'

export default function robots(): MetadataRoute.Robots {
  if (process.env.SITE_ENV === 'staging') {
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
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}