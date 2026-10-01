/**
 * Typed JSON-LD builders (spec §6.3).
 *
 * Every builder returns a plain serialisable object (Task 4's `<JsonLd>`
 * renders it). Inputs are structural types — deliberately NOT the Payload
 * generated types — so the builders stay unit-testable without Payload.
 * A missing required field is a TypeScript error; the tests pin the runtime
 * shape.
 */

type Address = {
  street?: string | null
  ward?: string | null
  district?: string | null
  city?: string | null
  country?: string | null
}

type SettingsLike = {
  brandName: string
  hotline: string
  email: string
  address?: Address | null
  socials?: {
    facebook?: string | null
    zalo?: string | null
    youtube?: string | null
    googleBusinessProfile?: string | null
  } | null
  defaultOgImage?: { url?: string | null; alt?: string | null } | number | null
  legalEntityName?: string | null
  taxCode?: string | null
}

/** strip trailing slashes so `${base}/path` never doubles the separator */
function trimBase(base: string): string {
  return base.replace(/\/+$/, '')
}

export function buildLegalServiceSchema(s: SettingsLike, base: string) {
  const a = s.address ?? {}
  const sameAs = [
    s.socials?.facebook,
    s.socials?.zalo,
    s.socials?.youtube,
    s.socials?.googleBusinessProfile,
  ].filter(Boolean) as string[]
  return {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    name: s.brandName,
    url: base,
    telephone: s.hotline,
    email: s.email,
    ...(s.taxCode ? { taxID: s.taxCode } : {}),
    ...(s.legalEntityName ? { legalName: s.legalEntityName } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: [a.street, a.ward].filter(Boolean).join(', '),
      addressLocality: a.city,
      addressRegion: a.district,
      addressCountry: a.country,
    },
    ...(sameAs.length ? { sameAs } : {}),
  }
}

export function buildWebSiteSchema(base: string, name: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: base,
    name,
    inLanguage: 'vi-VN',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${trimBase(base)}/tim-kiem/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildBreadcrumbSchema(items: { name: string; path: string }[], base: string) {
  const b = trimBase(base)
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${b}${it.path === '/' ? '/' : `${trimBase(it.path)}/`}`,
    })),
  }
}

export function buildServiceSchema(input: {
  name: string
  description?: string | null
  url: string
  provider: string
  offers: { name: string; price: string }[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    url: input.url,
    provider: { '@type': 'LegalService', name: input.provider },
    offers: input.offers.map((o) => ({ '@type': 'Offer', name: o.name, price: o.price })),
  }
}

export function buildFaqSchema(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    })),
  }
}

export function buildArticleSchema(input: {
  headline: string
  description?: string | null
  url: string
  datePublished?: string | null
  dateModified?: string | null
  author?: { name: string; credentials?: string | null } | null
  publisher: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    ...(input.description ? { description: input.description } : {}),
    url: input.url,
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    ...(input.author ? { author: buildPersonSchema(input.author) } : {}),
    publisher: { '@type': 'Organization', name: input.publisher },
    mainEntityOfPage: input.url,
  }
}

export function buildPersonSchema(input: { name: string; credentials?: string | null }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: input.name,
    ...(input.credentials ? { hasCredential: input.credentials } : {}),
  }
}
