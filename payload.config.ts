import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vi } from '@payloadcms/translations/languages/vi'
import { Users } from './src/payload/collections/Users'

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' — Quản trị Luật Gia Trí' },
  },
  collections: [Users],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'dev-secret-do-not-use-in-prod',
  typescript: { outputFile: 'src/payload-types.ts' },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI },
  }),
  i18n: {
    supportedLanguages: { vi },
    fallbackLanguage: 'vi',
  },
  telemetry: false,
})