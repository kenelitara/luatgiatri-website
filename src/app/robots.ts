import type { MetadataRoute } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://luatgiatri.com'

export default function robots(): MetadataRoute.Robots {
  if (process.env.SITE_ENV === 'staging') {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    }
  }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}