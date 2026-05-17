ALTER TABLE "workspace_invite" ADD COLUMN "team_id" text;--> statement-breakpoint
ALTER TABLE "workspace_invite" ADD CONSTRAINT "workspace_invite_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workspace_invite_team_id_idx" ON "workspace_invite" USING btree ("team_id");