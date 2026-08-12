CREATE TABLE "inspection" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"task_id" text,
	"grid_asset_id" text,
	"type" text NOT NULL,
	"description" text,
	"is_hold_point" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"scheduled_for" timestamp,
	"performed_at" timestamp,
	"inspector_name" text,
	"result" text,
	"readings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outage" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"circuit_id" text,
	"outage_number" text,
	"title" text NOT NULL,
	"type" text DEFAULT 'planned_outage' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"requested_start" timestamp,
	"requested_end" timestamp,
	"approved_start" timestamp,
	"approved_end" timestamp,
	"actual_start" timestamp,
	"actual_end" timestamp,
	"requested_by_id" text,
	"approved_by" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permit" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"grid_asset_id" text,
	"type" text DEFAULT 'other' NOT NULL,
	"permit_number" text,
	"description" text,
	"issuing_authority" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"applied_at" timestamp,
	"issued_at" timestamp,
	"expires_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_outage" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"outage_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "task_outage_task_outage_unique" UNIQUE("task_id","outage_id")
);
--> statement-breakpoint
ALTER TABLE "inspection" ADD CONSTRAINT "inspection_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "inspection" ADD CONSTRAINT "inspection_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "inspection" ADD CONSTRAINT "inspection_grid_asset_id_grid_asset_id_fk" FOREIGN KEY ("grid_asset_id") REFERENCES "public"."grid_asset"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "outage" ADD CONSTRAINT "outage_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "outage" ADD CONSTRAINT "outage_circuit_id_circuit_id_fk" FOREIGN KEY ("circuit_id") REFERENCES "public"."circuit"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "outage" ADD CONSTRAINT "outage_requested_by_id_user_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "permit" ADD CONSTRAINT "permit_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "permit" ADD CONSTRAINT "permit_grid_asset_id_grid_asset_id_fk" FOREIGN KEY ("grid_asset_id") REFERENCES "public"."grid_asset"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "task_outage" ADD CONSTRAINT "task_outage_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "task_outage" ADD CONSTRAINT "task_outage_outage_id_outage_id_fk" FOREIGN KEY ("outage_id") REFERENCES "public"."outage"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "inspection_projectId_idx" ON "inspection" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "inspection_taskId_idx" ON "inspection" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "inspection_gridAssetId_idx" ON "inspection" USING btree ("grid_asset_id");--> statement-breakpoint
CREATE INDEX "inspection_status_idx" ON "inspection" USING btree ("status");--> statement-breakpoint
CREATE INDEX "inspection_task_holdpoint_idx" ON "inspection" USING btree ("task_id","is_hold_point","status");--> statement-breakpoint
CREATE INDEX "outage_projectId_idx" ON "outage" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "outage_circuitId_idx" ON "outage" USING btree ("circuit_id");--> statement-breakpoint
CREATE INDEX "outage_status_idx" ON "outage" USING btree ("status");--> statement-breakpoint
CREATE INDEX "outage_requestedById_idx" ON "outage" USING btree ("requested_by_id");--> statement-breakpoint
CREATE INDEX "permit_projectId_idx" ON "permit" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "permit_gridAssetId_idx" ON "permit" USING btree ("grid_asset_id");--> statement-breakpoint
CREATE INDEX "permit_status_idx" ON "permit" USING btree ("status");--> statement-breakpoint
CREATE INDEX "permit_expiresAt_idx" ON "permit" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "task_outage_taskId_idx" ON "task_outage" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_outage_outageId_idx" ON "task_outage" USING btree ("outage_id");