/** SITE_ENV/NEXT_PUBLIC_SERVER_URL are BUILD-time inputs (spec §6.5) —
 *  prerendered robots.ts and metadata bake them at build. Single source. */
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://luatgiatri.com'
}

export function isStaging(): boolean {
  return process.env.SITE_ENV === 'staging'
}
