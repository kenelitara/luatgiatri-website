import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_tax_lookups_outcome" AS ENUM('found', 'notfound', 'unavailable', 'parsed-empty');
  CREATE TABLE "tax_lookups" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"mst" varchar NOT NULL,
  	"outcome" "enum_tax_lookups_outcome" DEFAULT 'notfound' NOT NULL,
  	"name" varchar,
  	"english_name" varchar,
  	"address" varchar,
  	"representative" varchar,
  	"fetched_at" timestamp(3) with time zone NOT NULL,
  	"source" varchar NOT NULL,
  	"fetched_by_ip_hash" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tax_lookups_id" integer;
  CREATE UNIQUE INDEX "tax_lookups_mst_idx" ON "tax_lookups" USING btree ("mst");
  CREATE INDEX "tax_lookups_updated_at_idx" ON "tax_lookups" USING btree ("updated_at");
  CREATE INDEX "tax_lookups_created_at_idx" ON "tax_lookups" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tax_lookups_fk" FOREIGN KEY ("tax_lookups_id") REFERENCES "public"."tax_lookups"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_tax_lookups_id_idx" ON "payload_locked_documents_rels" USING btree ("tax_lookups_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tax_lookups" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "tax_lookups" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tax_lookups_fk";
  
  DROP INDEX "payload_locked_documents_rels_tax_lookups_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tax_lookups_id";
  DROP TYPE "public"."enum_tax_lookups_outcome";`)
}
