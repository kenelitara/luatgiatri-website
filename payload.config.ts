import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vi } from '@payloadcms/translations/languages/vi'
import sharp from 'sharp'
import { Users } from './src/payload/collections/Users'
import { Media } from './src/payload/collections/Media'
import { Authors } from './src/payload/collections/Authors'
import { Categories } from './src/payload/collections/Categories'
import { Tags } from './src/payload/collections/Tags'
import { Posts } from './src/payload/collections/Posts'
import { Redirects } from './src/payload/collections/Redirects'
import { Leads } from './src/payload/collections/Leads'
import { Pages } from './src/payload/collections/Pages'
import { SiteSettings } from './src/payload/globals/SiteSettings'
import { Navigation } from './src/payload/globals/Navigation'

const secret = process.env.PAYLOAD_SECRET
if (
  !secret &&
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PHASE !== 'phase-production-build'
) {
  throw new Error('PAYLOAD_SECRET must be set in production')
}

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' — Quản trị Luật Gia Trí' },
  },
  collections: [Users, Media, Authors, Categories, Tags, Posts, Redirects, Leads, Pages],
  globals: [SiteSettings, Navigation],
  editor: lexicalEditor(),
  sharp,
  secret: secret ?? 'dev-secret-do-not-use-in-prod',
  typescript: { outputFile: 'src/payload-types.ts' },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI },
    // Migrations own the schema in EVERY environment (spec §11.2). Dev push
    // fights any column migrations create outside Payload's field system — the
    // raw `search_vector` columns (Task 8a) and earlier migration-owned columns
    // (TokenMatrix, showOverlay, logo/priceRange) — seeing them as drift and
    // offering to DROP them on every `pnpm dev` / `pnpm seed` / tsx script run
    // ("DATA LOSS WARNING"). push:false removes that whole class of prompt and
    // makes `pnpm payload migrate` the single source of truth. Schema changes in
    // development are now `pnpm payload migrate:create` + `pnpm payload migrate`;
    // a fresh dev DB must migrate before `pnpm seed`.
    push: false,
  }),
  i18n: {
    supportedLanguages: { vi },
    fallbackLanguage: 'vi',
  },
  telemetry: false,
})
