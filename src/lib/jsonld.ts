/**
 * Typed JSON-LD builders (spec §6.3, §6.9).
 *
 * Every builder returns a plain serialisable object (Task 4's `<JsonLd>`
 * renders it). Inputs are structural types — deliberately NOT the Payload
 * generated types — so the builders stay unit-testable without Payload.
 * A missing required field is a TypeScript error; the tests pin the runtime
 * shape.
 *
 * Only top-level nodes carry `@context`. Nested nodes (the Article's author,
 * the LegalService referenced by `@id`) are context-free; the sitewide
 * LegalService is referenced by `@id` so every page describes ONE entity.
 */

const SCHEMA_CONTEXT = 'https://schema.org'

export type Address = {
  street?: string | null
  ward?: string | null
  district?: string | null
  city?: string | null
  country?: string | null
}

/** a populated media relation (`{ url, alt }`) or its unpopulated id */
export type MediaLike = { url?: string | null; alt?: string | null } | number | null

export type SettingsLike = {
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
  /** SiteSettings.logo (upload relation) — Organization/knowledge-panel logo */
  logo?: MediaLike
  /** SiteSettings.openingHours — free text, e.g. "Mo-Fr 08:00-17:30" */
  openingHours?: string | null
  /** SiteSettings.priceRange — free text, e.g. "500.000đ - 20.000.000đ" */
  priceRange?: string | null
  legalEntityName?: string | null
  taxCode?: string | null
}

/** the author argument: a name, a full Person input, or an `@id` reference */
type PersonInput = { name: string; credentials?: string | null }

/** a reference to an entity defined elsewhere on the site (§6.9) */
export type EntityRef = { '@id': string }

/** strip trailing slashes so `${base}/path` never doubles the separator */
function trimBase(base: string): string {
  return base.replace(/\/+$/, '')
}

/** absolute URL for a same-origin media path; already-absolute URLs pass through */
function absoluteFrom(base: string, url: string): string {
  if (/^https?:\/\//.test(url)) return url
  return `${trimBase(base)}${url.startsWith('/') ? url : `/${url}`}`
}

/** the sitewide LegalService `@id` — Task 4 passes this to reference one entity */
export function legalServiceId(base: string): string {
  return `${trimBase(base)}/#legalservice`
}

/** the URL a populated upload relation points at (null when unpopulated/absent) */
function mediaUrl(media: MediaLike | undefined): string | null {
  if (!media || typeof media === 'number') return null
  return media.url ?? null
}

/** context-free Person node — embedded inside other nodes */
function personNode(input: PersonInput) {
  return {
    '@type': 'Person',
    name: input.name,
    ...(input.credentials
      ? {
          hasCredential: {
            '@type': 'EducationalOccupationalCredential',
            name: input.credentials,
          },
        }
      : {}),
  }
}

/** resolve the Article `author` argument (name | Person input | `@id` ref) */
function authorNode(input: string | PersonInput | EntityRef) {
  if (typeof input === 'string') return personNode({ name: input })
  if ('@id' in input) return input
  return personNode(input)
}

/** resolve the Article `publisher` argument (name | `@id` ref) */
function publisherNode(input: string | EntityRef) {
  return typeof input === 'string' ? { '@type': 'Organization', name: input } : input
}

/** resolve the Service `provider` argument (name | `@id` ref, §6.9) */
function providerNode(input: string | EntityRef) {
  return typeof input === 'string' ? { '@type': 'LegalService', name: input } : input
}

export function buildLegalServiceSchema(s: SettingsLike, base: string) {
  const a = s.address ?? {}
  const sameAs = [
    s.socials?.facebook,
    s.socials?.zalo,
    s.socials?.youtube,
    s.socials?.googleBusinessProfile,
  ].filter(Boolean) as string[]
  const logoUrl = mediaUrl(s.logo)
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'LegalService',
    '@id': legalServiceId(base),
    name: s.brandName,
    url: trimBase(base),
    telephone: s.hotline,
    email: s.email,
    ...(s.taxCode ? { taxID: s.taxCode } : {}),
    ...(s.legalEntityName ? { legalName: s.legalEntityName } : {}),
    // logo + image are omitted until the firm uploads SiteSettings.logo
    ...(logoUrl ? { logo: absoluteFrom(base, logoUrl), image: absoluteFrom(base, logoUrl) } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: [a.street, a.ward].filter(Boolean).join(', '),
      addressLocality: a.city,
      addressRegion: a.district,
      addressCountry: a.country,
    },
    ...(a.city ? { areaServed: { '@type': 'City', name: a.city } } : {}),
    // schema.org's plain-text `openingHours` accepts the free-text form the firm
    // edits ("Mo-Fr 08:00-17:30"); the structured `openingHoursSpecification`
    // would need a field-shape change that buys nothing here (spec §6.3).
    ...(s.openingHours ? { openingHours: s.openingHours } : {}),
    ...(s.priceRange ? { priceRange: s.priceRange } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  }
}

export function buildWebSiteSchema(base: string, name: string) {
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'WebSite',
    url: trimBase(base),
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
    '@context': SCHEMA_CONTEXT,
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
  /** a LegalService name, or `{ '@id': legalServiceId(base) }` to reference the sitewide entity (§6.9) */
  provider: string | EntityRef
  offers: { name: string; price: string }[]
}) {
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'Service',
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    url: input.url,
    provider: providerNode(input.provider),
    offers: input.offers.map((o) => ({ '@type': 'Offer', name: o.name, price: o.price })),
  }
}

export function buildFaqSchema(items: { question: string; answer: string }[]) {
  return {
    '@context': SCHEMA_CONTEXT,
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
  /** a Person input (or name); pass `{ '@id': legalServiceId(base) }` later */
  author?: string | PersonInput | EntityRef | null
  /** a publisher name; pass `{ '@id': legalServiceId(base) }` to reference the site entity */
  publisher: string | EntityRef
}) {
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'Article',
    headline: input.headline,
    ...(input.description ? { description: input.description } : {}),
    url: input.url,
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    ...(input.author ? { author: authorNode(input.author) } : {}),
    publisher: publisherNode(input.publisher),
    mainEntityOfPage: input.url,
  }
}

export function buildPersonSchema(input: PersonInput) {
  return { '@context': SCHEMA_CONTEXT, ...personNode(input) }
}
