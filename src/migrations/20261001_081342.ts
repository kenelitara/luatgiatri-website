import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_token_matrix_sections_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "pages_blocks_token_matrix_sections_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "pages_blocks_token_matrix_sections_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_token_matrix_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar
  );
  
  CREATE TABLE "pages_blocks_token_matrix" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"note" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_token_matrix_sections_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_token_matrix_sections_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_token_matrix_sections_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_token_matrix_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_token_matrix" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"note" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_token_matrix_sections_columns" ADD CONSTRAINT "pages_blocks_token_matrix_sections_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_token_matrix_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_token_matrix_sections_rows_cells" ADD CONSTRAINT "pages_blocks_token_matrix_sections_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_token_matrix_sections_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_token_matrix_sections_rows" ADD CONSTRAINT "pages_blocks_token_matrix_sections_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_token_matrix_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_token_matrix_sections" ADD CONSTRAINT "pages_blocks_token_matrix_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_token_matrix"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_token_matrix" ADD CONSTRAINT "pages_blocks_token_matrix_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_token_matrix_sections_columns" ADD CONSTRAINT "_pages_v_blocks_token_matrix_sections_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_token_matrix_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_token_matrix_sections_rows_cells" ADD CONSTRAINT "_pages_v_blocks_token_matrix_sections_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_token_matrix_sections_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_token_matrix_sections_rows" ADD CONSTRAINT "_pages_v_blocks_token_matrix_sections_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_token_matrix_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_token_matrix_sections" ADD CONSTRAINT "_pages_v_blocks_token_matrix_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_token_matrix"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_token_matrix" ADD CONSTRAINT "_pages_v_blocks_token_matrix_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_token_matrix_sections_columns_order_idx" ON "pages_blocks_token_matrix_sections_columns" USING btree ("_order");
  CREATE INDEX "pages_blocks_token_matrix_sections_columns_parent_id_idx" ON "pages_blocks_token_matrix_sections_columns" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_token_matrix_sections_rows_cells_order_idx" ON "pages_blocks_token_matrix_sections_rows_cells" USING btree ("_order");
  CREATE INDEX "pages_blocks_token_matrix_sections_rows_cells_parent_id_idx" ON "pages_blocks_token_matrix_sections_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_token_matrix_sections_rows_order_idx" ON "pages_blocks_token_matrix_sections_rows" USING btree ("_order");
  CREATE INDEX "pages_blocks_token_matrix_sections_rows_parent_id_idx" ON "pages_blocks_token_matrix_sections_rows" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_token_matrix_sections_order_idx" ON "pages_blocks_token_matrix_sections" USING btree ("_order");
  CREATE INDEX "pages_blocks_token_matrix_sections_parent_id_idx" ON "pages_blocks_token_matrix_sections" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_token_matrix_order_idx" ON "pages_blocks_token_matrix" USING btree ("_order");
  CREATE INDEX "pages_blocks_token_matrix_parent_id_idx" ON "pages_blocks_token_matrix" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_token_matrix_path_idx" ON "pages_blocks_token_matrix" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_token_matrix_sections_columns_order_idx" ON "_pages_v_blocks_token_matrix_sections_columns" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_token_matrix_sections_columns_parent_id_idx" ON "_pages_v_blocks_token_matrix_sections_columns" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_token_matrix_sections_rows_cells_order_idx" ON "_pages_v_blocks_token_matrix_sections_rows_cells" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_token_matrix_sections_rows_cells_parent_id_idx" ON "_pages_v_blocks_token_matrix_sections_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_token_matrix_sections_rows_order_idx" ON "_pages_v_blocks_token_matrix_sections_rows" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_token_matrix_sections_rows_parent_id_idx" ON "_pages_v_blocks_token_matrix_sections_rows" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_token_matrix_sections_order_idx" ON "_pages_v_blocks_token_matrix_sections" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_token_matrix_sections_parent_id_idx" ON "_pages_v_blocks_token_matrix_sections" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_token_matrix_order_idx" ON "_pages_v_blocks_token_matrix" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_token_matrix_parent_id_idx" ON "_pages_v_blocks_token_matrix" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_token_matrix_path_idx" ON "_pages_v_blocks_token_matrix" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_token_matrix_sections_columns" CASCADE;
  DROP TABLE "pages_blocks_token_matrix_sections_rows_cells" CASCADE;
  DROP TABLE "pages_blocks_token_matrix_sections_rows" CASCADE;
  DROP TABLE "pages_blocks_token_matrix_sections" CASCADE;
  DROP TABLE "pages_blocks_token_matrix" CASCADE;
  DROP TABLE "_pages_v_blocks_token_matrix_sections_columns" CASCADE;
  DROP TABLE "_pages_v_blocks_token_matrix_sections_rows_cells" CASCADE;
  DROP TABLE "_pages_v_blocks_token_matrix_sections_rows" CASCADE;
  DROP TABLE "_pages_v_blocks_token_matrix_sections" CASCADE;
  DROP TABLE "_pages_v_blocks_token_matrix" CASCADE;`)
}
