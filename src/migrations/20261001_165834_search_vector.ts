import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE EXTENSION IF NOT EXISTS unaccent;
    ALTER TABLE "pages"      ADD COLUMN IF NOT EXISTS "search_vector" tsvector;
    ALTER TABLE "posts"      ADD COLUMN IF NOT EXISTS "search_vector" tsvector;
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;
    CREATE INDEX IF NOT EXISTS "pages_search_vector_idx"      ON "pages"      USING gin ("search_vector");
    CREATE INDEX IF NOT EXISTS "posts_search_vector_idx"      ON "posts"      USING gin ("search_vector");
    CREATE INDEX IF NOT EXISTS "categories_search_vector_idx" ON "categories" USING gin ("search_vector");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "pages_search_vector_idx";
    DROP INDEX IF EXISTS "posts_search_vector_idx";
    DROP INDEX IF EXISTS "categories_search_vector_idx";
    ALTER TABLE "pages"      DROP COLUMN IF EXISTS "search_vector";
    ALTER TABLE "posts"      DROP COLUMN IF EXISTS "search_vector";
    ALTER TABLE "categories" DROP COLUMN IF EXISTS "search_vector";
  `)
}
