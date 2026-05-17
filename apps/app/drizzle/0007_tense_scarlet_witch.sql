CREATE TYPE "public"."sprint_status" AS ENUM('planned', 'active', 'completed');--> statement-breakpoint
CREATE TABLE "sprint" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"goal" text,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "sprint_status" DEFAULT 'planned' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sprint_issue" (
	"id" text PRIMARY KEY NOT NULL,
	"sprint_id" text NOT NULL,
	"issue_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "issue" ADD COLUMN "start_date" date;--> statement-breakpoint
ALTER TABLE "sprint" ADD CONSTRAINT "sprint_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sprint" ADD CONSTRAINT "sprint_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sprint" ADD CONSTRAINT "sprint_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sprint_issue" ADD CONSTRAINT "sprint_issue_sprint_id_sprint_id_fk" FOREIGN KEY ("sprint_id") REFERENCES "public"."sprint"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sprint_issue" ADD CONSTRAINT "sprint_issue_issue_id_issue_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sprint_project_idx" ON "sprint" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "sprint_workspace_project_dates_idx" ON "sprint" USING btree ("workspace_id","project_id","start_date");--> statement-breakpoint
CREATE UNIQUE INDEX "sprint_issue_issue_unique" ON "sprint_issue" USING btree ("issue_id");--> statement-breakpoint
CREATE INDEX "sprint_issue_sprint_idx" ON "sprint_issue" USING btree ("sprint_id");--> statement-breakpoint
CREATE INDEX "sprint_issue_sprint_position_idx" ON "sprint_issue" USING btree ("sprint_id","position");