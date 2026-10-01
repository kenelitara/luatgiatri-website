import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_hero_carousel" ADD COLUMN "show_overlay" boolean DEFAULT false;
  ALTER TABLE "_pages_v_blocks_hero_carousel" ADD COLUMN "show_overlay" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_hero_carousel" DROP COLUMN "show_overlay";
  ALTER TABLE "_pages_v_blocks_hero_carousel" DROP COLUMN "show_overlay";`)
}
