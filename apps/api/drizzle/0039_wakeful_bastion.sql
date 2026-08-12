CREATE TABLE "construction_unit" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"code" text NOT NULL,
	"description" text NOT NULL,
	"unit_of_measure" text DEFAULT 'EA' NOT NULL,
	"discipline" text,
	"install_hours" text,
	"remove_hours" text,
	"transfer_hours" text,
	"install_price" text,
	"remove_price" text,
	"transfer_price" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "construction_unit_workspace_code_unique" UNIQUE("workspace_id","code")
);
--> statement-breakpoint
CREATE TABLE "crew_member" (
	"id" text PRIMARY KEY NOT NULL,
	"crew_id" text NOT NULL,
	"user_id" text NOT NULL,
	"classification" text DEFAULT 'journeyman' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "crew_member_crew_user_unique" UNIQUE("crew_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "crew" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"crew_type" text DEFAULT 'line' NOT NULL,
	"foreman_user_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "crew_workspace_name_unique" UNIQUE("workspace_id","name")
);
--> statement-breakpoint
CREATE TABLE "daily_report" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"crew_id" text,
	"report_date" timestamp NOT NULL,
	"foreman_user_id" text,
	"weather_conditions" text,
	"temperature_high" text,
	"temperature_low" text,
	"work_performed" text,
	"delays" text,
	"visitors" text,
	"safety_topic" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp,
	"approved_by_user_id" text,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_report_project_crew_date_unique" UNIQUE("project_id","crew_id","report_date")
);
--> statement-breakpoint
CREATE TABLE "equipment_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"daily_report_id" text NOT NULL,
	"equipment_id" text NOT NULL,
	"hours_used" text DEFAULT '0' NOT NULL,
	"hours_idle" text DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "equipment_entry_report_equipment_unique" UNIQUE("daily_report_id","equipment_id")
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"unit_number" text NOT NULL,
	"description" text,
	"equipment_type" text DEFAULT 'other' NOT NULL,
	"hourly_rate" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "equipment_workspace_unit_unique" UNIQUE("workspace_id","unit_number")
);
--> statement-breakpoint
CREATE TABLE "labor_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"daily_report_id" text NOT NULL,
	"user_id" text,
	"worker_name" text NOT NULL,
	"classification" text DEFAULT 'journeyman' NOT NULL,
	"regular_hours" text DEFAULT '0' NOT NULL,
	"overtime_hours" text DEFAULT '0' NOT NULL,
	"double_time_hours" text DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pay_item" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"construction_unit_id" text NOT NULL,
	"grid_asset_id" text,
	"action" text DEFAULT 'install' NOT NULL,
	"estimated_quantity" text DEFAULT '0' NOT NULL,
	"unit_price" text,
	"standard_hours" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pay_item_project_unit_action_asset_unique" UNIQUE("project_id","construction_unit_id","action","grid_asset_id")
);
--> statement-breakpoint
CREATE TABLE "production_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"pay_item_id" text NOT NULL,
	"daily_report_id" text,
	"crew_id" text,
	"quantity" text DEFAULT '0' NOT NULL,
	"entry_date" timestamp NOT NULL,
	"entered_by_user_id" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tailboard" (
	"id" text PRIMARY KEY NOT NULL,
	"daily_report_id" text NOT NULL,
	"job_steps" text,
	"hazards" text,
	"controls" text,
	"minimum_approach_distance" text,
	"grounding_plan" text,
	"emergency_plan" text,
	"signatures" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tailboard_daily_report_id_unique" UNIQUE("daily_report_id")
);
--> statement-breakpoint
ALTER TABLE "construction_unit" ADD CONSTRAINT "construction_unit_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "crew_member" ADD CONSTRAINT "crew_member_crew_id_crew_id_fk" FOREIGN KEY ("crew_id") REFERENCES "public"."crew"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "crew_member" ADD CONSTRAINT "crew_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "crew" ADD CONSTRAINT "crew_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "crew" ADD CONSTRAINT "crew_foreman_user_id_user_id_fk" FOREIGN KEY ("foreman_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "daily_report" ADD CONSTRAINT "daily_report_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "daily_report" ADD CONSTRAINT "daily_report_crew_id_crew_id_fk" FOREIGN KEY ("crew_id") REFERENCES "public"."crew"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "daily_report" ADD CONSTRAINT "daily_report_foreman_user_id_user_id_fk" FOREIGN KEY ("foreman_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "daily_report" ADD CONSTRAINT "daily_report_approved_by_user_id_user_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "equipment_entry" ADD CONSTRAINT "equipment_entry_daily_report_id_daily_report_id_fk" FOREIGN KEY ("daily_report_id") REFERENCES "public"."daily_report"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "equipment_entry" ADD CONSTRAINT "equipment_entry_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "labor_entry" ADD CONSTRAINT "labor_entry_daily_report_id_daily_report_id_fk" FOREIGN KEY ("daily_report_id") REFERENCES "public"."daily_report"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "labor_entry" ADD CONSTRAINT "labor_entry_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "pay_item" ADD CONSTRAINT "pay_item_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "pay_item" ADD CONSTRAINT "pay_item_construction_unit_id_construction_unit_id_fk" FOREIGN KEY ("construction_unit_id") REFERENCES "public"."construction_unit"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "pay_item" ADD CONSTRAINT "pay_item_grid_asset_id_grid_asset_id_fk" FOREIGN KEY ("grid_asset_id") REFERENCES "public"."grid_asset"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "production_entry" ADD CONSTRAINT "production_entry_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "production_entry" ADD CONSTRAINT "production_entry_pay_item_id_pay_item_id_fk" FOREIGN KEY ("pay_item_id") REFERENCES "public"."pay_item"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "production_entry" ADD CONSTRAINT "production_entry_daily_report_id_daily_report_id_fk" FOREIGN KEY ("daily_report_id") REFERENCES "public"."daily_report"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "production_entry" ADD CONSTRAINT "production_entry_crew_id_crew_id_fk" FOREIGN KEY ("crew_id") REFERENCES "public"."crew"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "production_entry" ADD CONSTRAINT "production_entry_entered_by_user_id_user_id_fk" FOREIGN KEY ("entered_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tailboard" ADD CONSTRAINT "tailboard_daily_report_id_daily_report_id_fk" FOREIGN KEY ("daily_report_id") REFERENCES "public"."daily_report"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "construction_unit_workspaceId_idx" ON "construction_unit" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "construction_unit_code_idx" ON "construction_unit" USING btree ("code");--> statement-breakpoint
CREATE INDEX "crew_member_crewId_idx" ON "crew_member" USING btree ("crew_id");--> statement-breakpoint
CREATE INDEX "crew_member_userId_idx" ON "crew_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "crew_workspaceId_idx" ON "crew" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "crew_foremanUserId_idx" ON "crew" USING btree ("foreman_user_id");--> statement-breakpoint
CREATE INDEX "daily_report_projectId_idx" ON "daily_report" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "daily_report_crewId_idx" ON "daily_report" USING btree ("crew_id");--> statement-breakpoint
CREATE INDEX "daily_report_reportDate_idx" ON "daily_report" USING btree ("report_date");--> statement-breakpoint
CREATE INDEX "daily_report_status_idx" ON "daily_report" USING btree ("status");--> statement-breakpoint
CREATE INDEX "equipment_entry_dailyReportId_idx" ON "equipment_entry" USING btree ("daily_report_id");--> statement-breakpoint
CREATE INDEX "equipment_entry_equipmentId_idx" ON "equipment_entry" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "equipment_workspaceId_idx" ON "equipment" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "labor_entry_dailyReportId_idx" ON "labor_entry" USING btree ("daily_report_id");--> statement-breakpoint
CREATE INDEX "labor_entry_userId_idx" ON "labor_entry" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pay_item_projectId_idx" ON "pay_item" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "pay_item_constructionUnitId_idx" ON "pay_item" USING btree ("construction_unit_id");--> statement-breakpoint
CREATE INDEX "pay_item_gridAssetId_idx" ON "pay_item" USING btree ("grid_asset_id");--> statement-breakpoint
CREATE INDEX "production_entry_projectId_idx" ON "production_entry" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "production_entry_payItemId_idx" ON "production_entry" USING btree ("pay_item_id");--> statement-breakpoint
CREATE INDEX "production_entry_dailyReportId_idx" ON "production_entry" USING btree ("daily_report_id");--> statement-breakpoint
CREATE INDEX "production_entry_crewId_idx" ON "production_entry" USING btree ("crew_id");--> statement-breakpoint
CREATE INDEX "production_entry_entryDate_idx" ON "production_entry" USING btree ("entry_date");--> statement-breakpoint
CREATE INDEX "tailboard_dailyReportId_idx" ON "tailboard" USING btree ("daily_report_id");