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
    // Brand mark in the admin's logo slots (login / logout / verify).
    // `admin.components.graphics.Logo` is the public hook — @payloadcms/next's
    // elements/Logo/index.js renders it in place of Payload's own wordmark
    // (RenderServerComponent with Fallback: PayloadLogo). Alias form for the
    // same reason as the SeoPanel registration: payload.config.ts sits at the
    // repo root, so importMap.baseDir is the root and a leading-slash path
    // would resolve to <root>/components/… instead of src/components/…. Run
    // `pnpm generate:importmap` after changing this.
    components: {
      graphics: {
        Logo: '@/components/admin/AdminBrand#AdminBrand',
      },
    },
    meta: {
      titleSuffix: ' — Quản trị Luật Gia Trí',
      // Admin tab icon. `admin.meta` is spread into
      // @payloadcms/next's generateMetadata(), where `icons` REPLACES
      // Payload's default favicon pair (verified in
      // node_modules/@payloadcms/next/dist/utilities/meta.js: `const icons =
      // incomingMetadata.icons || [payloadFaviconDark, payloadFaviconLight]`).
      // `/icon.svg` is the committed brand asset (src/app/icon.svg) that the
      // public site's file-convention favicon already uses; generateMetadata
      // sets `metadataBase` from config.serverURL, so the root-relative URL
      // resolves to an absolute one. Shape per Next's Metadata['icons'].
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/icon.svg' }],
    },
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
    // Payload's own `vi` locale ships `general.collections` as the untranslated
    // English string 'Collections' (node_modules/@payloadcms/translations/dist/
    // languages/vi.js) — it renders as the "Collections" group heading in the
    // admin nav and dashboard. The sibling key `general.allCollections` is
    // already 'Tất cả Bộ sưu tập', so 'Bộ sưu tập' is the internally consistent
    // term. These values are deep-merged OVER the language pack (initTFunction
    // → deepMergeSimple in @payloadcms/translations), so only the overridden
    // key is needed; the rest of the pack is untouched.
    translations: {
      vi: {
        general: {
          collections: 'Bộ sưu tập',
        },
      },
    },
  },
  telemetry: false,
})
