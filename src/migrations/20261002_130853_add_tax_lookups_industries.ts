import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "tax_lookups_industries" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"code" varchar,
  	"name" varchar
  );
  
  ALTER TABLE "tax_lookups_industries" ADD CONSTRAINT "tax_lookups_industries_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tax_lookups"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "tax_lookups_industries_order_idx" ON "tax_lookups_industries" USING btree ("_order");
  CREATE INDEX "tax_lookups_industries_parent_id_idx" ON "tax_lookups_industries" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "tax_lookups_industries" CASCADE;`)
}
