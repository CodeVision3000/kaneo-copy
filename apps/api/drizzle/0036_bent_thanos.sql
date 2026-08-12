ALTER TABLE "task" ALTER COLUMN "status" SET DEFAULT 'scheduled';--> statement-breakpoint
ALTER TABLE "task" ALTER COLUMN "priority" SET DEFAULT 'routine';--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "discipline" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "utility_client" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "contract_number" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "work_order_number" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "contract_type" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "voltage_kv" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "mobilization_date" timestamp;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "energization_target_date" timestamp;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "substantial_completion_date" timestamp;--> statement-breakpoint
CREATE INDEX "project_discipline_idx" ON "project" USING btree ("discipline");