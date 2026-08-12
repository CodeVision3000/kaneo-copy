CREATE TABLE "circuit" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"designation" text NOT NULL,
	"name" text,
	"type" text DEFAULT 'transmission_line' NOT NULL,
	"voltage_kv" text,
	"substation_from" text,
	"substation_to" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "circuit_project_designation_unique" UNIQUE("project_id","designation")
);
--> statement-breakpoint
CREATE TABLE "grid_asset" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"circuit_id" text,
	"parent_grid_asset_id" text,
	"asset_type" text DEFAULT 'structure' NOT NULL,
	"designation" text NOT NULL,
	"description" text,
	"sequence" integer,
	"latitude" text,
	"longitude" text,
	"stationing" text,
	"voltage_kv" text,
	"attributes" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "grid_asset_project_designation_unique" UNIQUE("project_id","designation")
);
--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "grid_asset_id" text;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "hold_reason" text;--> statement-breakpoint
ALTER TABLE "circuit" ADD CONSTRAINT "circuit_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "grid_asset" ADD CONSTRAINT "grid_asset_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "grid_asset" ADD CONSTRAINT "grid_asset_circuit_id_circuit_id_fk" FOREIGN KEY ("circuit_id") REFERENCES "public"."circuit"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "grid_asset" ADD CONSTRAINT "grid_asset_parent_grid_asset_id_grid_asset_id_fk" FOREIGN KEY ("parent_grid_asset_id") REFERENCES "public"."grid_asset"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "circuit_projectId_idx" ON "circuit" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "grid_asset_projectId_idx" ON "grid_asset" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "grid_asset_circuitId_idx" ON "grid_asset" USING btree ("circuit_id");--> statement-breakpoint
CREATE INDEX "grid_asset_parentId_idx" ON "grid_asset" USING btree ("parent_grid_asset_id");--> statement-breakpoint
CREATE INDEX "grid_asset_assetType_idx" ON "grid_asset" USING btree ("asset_type");--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_grid_asset_id_grid_asset_id_fk" FOREIGN KEY ("grid_asset_id") REFERENCES "public"."grid_asset"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "task_gridAssetId_idx" ON "task" USING btree ("grid_asset_id");