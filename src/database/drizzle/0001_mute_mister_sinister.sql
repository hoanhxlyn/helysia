DROP INDEX "todos_user_id_idx";--> statement-breakpoint
CREATE INDEX "todos_user_id_id_idx" ON "todos" USING btree ("user_id","id");