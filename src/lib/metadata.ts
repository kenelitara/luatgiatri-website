import type { Metadata } from 'next'
import { getBaseUrl, isStaging } from '@/lib/site-env'

export type MetadataInput = {
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
}

const BRAND = 'Luật Gia Trí'

/** absolute URL for a same-origin path, normalised to the trailing-slash policy */
function absolute(path: string): string {
  const base = getBaseUrl().replace(/\/+$/, '')
  const clean = path === '/' ? '/' : `${path.replace(/\/+$/, '')}/`
  return `${base}${clean}`
}

function absoluteOrNull(url?: string | null): string | null {
  if (!url) return null
  if (/^https?:\/\//.test(url)) return url
  return `${getBaseUrl().replace(/\/+$/, '')}${url.startsWith('/') ? url : `/${url}`}`
}

/**
 * The ONLY path by which a route produces metadata (spec §6.1). Composing it
 * here is what makes the live site's og:site_name/<title> divergence and its
 * blanket noindex unrepeatable.
 */
export function buildMetadata(input: MetadataInput): Metadata {
  const staging = isStaging()
  const robots = staging
    ? { index: false, follow: false }
    : input.noindex
      ? { index: false, follow: true } // per-record opt-out (spec §6.5), still followable
      : { index: true, follow: true }

  const canonical = input.canonicalOverride ?? absolute(input.path)
  const image = absoluteOrNull(input.ogImage) ?? absoluteOrNull(input.defaultOgImage)

  return {
    title: `${input.title} | ${BRAND}`,
    description: input.description ?? undefined,
    alternates: { canonical },
    robots,
    openGraph: {
      title: input.title,
      description: input.description ?? undefined,
      url: canonical,
      siteName: BRAND,
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
      card: 'summary_large_image',
      title: input.title,
      ...(input.description ? { description: input.description } : {}),
      ...(image ? { images: [image] } : {}),
    },
  }
}
