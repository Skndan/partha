import postgres from "postgres";
import { NextResponse } from "next/server";

import { env } from "@/env";
import { getWorkspaceApiContext } from "@/lib/workspaces/api-access";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const context = await getWorkspaceApiContext(slug);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const encoder = new TextEncoder();
  const sql = postgres(env.DATABASE_URL, {
    max: 1,
    idle_timeout: 10,
  });
  let keepAlive: ReturnType<typeof setInterval> | null = null;
  let unlisten: (() => void) | null = null;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(`event: ping\ndata: ${Date.now()}\n\n`));
      }, 15000);

      const listener = await sql.listen("workspace_events", (rawPayload) => {
        try {
          const payload = JSON.parse(rawPayload ?? "{}") as {
            workspaceId?: string;
            type?: string;
            payload?: unknown;
            timestamp?: string;
          };

          if (payload.workspaceId !== context.workspaceId) {
            return;
          }

          controller.enqueue(
            encoder.encode(
              `event: ${payload.type ?? "message"}\ndata: ${JSON.stringify(payload)}\n\n`,
            ),
          );
        } catch {
          // Ignore malformed payloads.
        }
      });
      unlisten = () => listener.unlisten();
    },
    async cancel() {
      if (keepAlive) clearInterval(keepAlive);
      if (unlisten) unlisten();
      await sql.end().catch(() => { });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
