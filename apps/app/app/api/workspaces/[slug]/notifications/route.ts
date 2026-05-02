import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/lib/db/db";
import { notification } from "@/lib/db/schema";
import { getWorkspaceApiContext } from "@/lib/workspaces/api-access";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const context = await getWorkspaceApiContext(slug);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await db
    .select()
    .from(notification)
    .where(
      and(
        eq(notification.workspaceId, context.workspaceId),
        eq(notification.userId, context.userId),
      ),
    )
    .orderBy(desc(notification.createdAt));

  return NextResponse.json({ notifications });
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const context = await getWorkspaceApiContext(slug);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db
    .update(notification)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notification.workspaceId, context.workspaceId),
        eq(notification.userId, context.userId),
        isNull(notification.readAt),
      ),
    );

  return NextResponse.json({ ok: true });
}
