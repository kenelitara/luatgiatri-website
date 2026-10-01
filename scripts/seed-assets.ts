/**
 * Assets that belong in the seed but are NOT referenced by any content fixture
 * (so `seed-media.ts`'s fixture scan would never find them). Kept in one place
 * so both seed scripts agree on the source URL and alt.
 *
 * Currently: the site logo, uploaded by `seed:media` and wired into the
 * SiteSettings global by `seed` — a fresh DB reproduces the header logo with no
 * manual admin step (the firm can still replace it in the admin afterwards).
 */
export const EXTRA_ASSETS: { url: string; alt: string }[] = [
  {
    url: 'https://luatgiatri.com/wp-content/uploads/2026/07/Gia-Tri-Law-logo.svg',
    alt: 'Luật Gia Trí',
  },
]

/** The logo URL, for consumers that need it by name (seed.ts). */
export const SITE_LOGO_URL = EXTRA_ASSETS[0].url
