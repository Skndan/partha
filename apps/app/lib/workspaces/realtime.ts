import { db } from "@/lib/db/db";
import { sql } from "drizzle-orm";

type WorkspaceRealtimeEvent = {
  workspaceId: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp?: string;
};

export async function publishWorkspaceEvent(event: WorkspaceRealtimeEvent) {
  const payload = JSON.stringify({
    ...event,
    timestamp: event.timestamp ?? new Date().toISOString(),
  });

  await db.execute(sql`select pg_notify('workspace_events', ${payload})`);
}
