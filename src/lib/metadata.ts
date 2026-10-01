import type { Metadata } from 'next'
import { getBaseUrl, isStaging } from '@/lib/site-env'

export type MetadataInput = {
  /** never includes the brand — it is appended here unless `branded: false` */
  title: string
  description?: string | null
  path: string
  type?: 'website' | 'article'
  /** per-record seo group values (M2 content model) */
  noindex?: boolean
  canonicalOverride?: string | null
  ogImage?: string | null
  defaultOgImage?: string | null
  publishedTime?: string | null
  modifiedTime?: string | null
  /** SiteSettings.brandName — single source (spec §6.1/§6.9) */
  brandName?: string | null
  /** when false, `title` is emitted verbatim (the homepage names the brand itself, §6.9) */
  branded?: boolean
}

const DEFAULT_BRAND = 'Luật Gia Trí'

/** absolute URL for a same-origin path — pathname only (query/hash are stripped),
 *  normalised to the trailing-slash policy (spec §6.7) */
function absolute(path: string): string {
  const base = getBaseUrl().replace(/\/+$/, '')
  const pathname = path.split(/[?#]/)[0] || '/'
  const withLeading = pathname.startsWith('/') ? pathname : `/${pathname}`
  const clean = withLeading === '/' ? '/' : `${withLeading.replace(/\/+$/, '')}/`
  return `${base}${clean}`
}

function absoluteOrNull(url?: string | null): string | null {
  if (!url) return null
  if (/^(https?:)?\/\//.test(url)) return url.startsWith('//') ? `https:${url}` : url
  return `${getBaseUrl().replace(/\/+$/, '')}${url.startsWith('/') ? url : `/${url}`}`
}

/**
 * The ONLY path by which a route produces metadata (spec §6.1). Composing it
 * here is what makes the live site's og:site_name/<title> divergence and its
 * blanket noindex unrepeatable.
 */
export function buildMetadata(input: MetadataInput): Metadata {
  const brand = input.brandName ?? DEFAULT_BRAND
  const staging = isStaging()
  const robots = staging
    ? { index: false, follow: false }
    : input.noindex
      ? { index: false, follow: true } // per-record opt-out (spec §6.5), still followable
      : { index: true, follow: true }

  const canonical = input.canonicalOverride ?? absolute(input.path)
  const image = absoluteOrNull(input.ogImage) ?? absoluteOrNull(input.defaultOgImage)
  const title = input.branded === false ? input.title : `${input.title} | ${brand}`

  return {
    title,
    description: input.description || undefined,
    alternates: { canonical },
    robots,
    openGraph: {
      title: input.title,
      description: input.description || undefined,
      url: canonical,
      siteName: brand,
      locale: 'vi_VN',
      type: input.type ?? 'website',
      ...(input.type === 'article'
        ? {
            publishedTime: input.publishedTime ?? undefined,
            modifiedTime: input.modifiedTime ?? undefined,
          }
        : {}),
      ...(image ? { images: [image] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: input.title,
      ...(input.description ? { description: input.description } : {}),
      ...(image ? { images: [image] } : {}),
    },
  }
}
