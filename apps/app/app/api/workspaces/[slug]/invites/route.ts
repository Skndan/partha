import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/lib/db/db";
import { workspaceInvite } from "@/lib/db/schema";
import { CreateWorkspaceInviteSchema } from "@/lib/validators/workspace";
import { getWorkspaceApiContext } from "@/lib/workspaces/api-access";
import { createNotification } from "@/lib/workspaces/notifications";
import { publishWorkspaceEvent } from "@/lib/workspaces/realtime";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const context = await getWorkspaceApiContext(slug);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invites = await db
    .select()
    .from(workspaceInvite)
    .where(
      and(
        eq(workspaceInvite.workspaceId, context.workspaceId),
        isNull(workspaceInvite.acceptedAt),
      ),
    );

  return NextResponse.json({ invites });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const context = await getWorkspaceApiContext(slug);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (context.role === "member") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = CreateWorkspaceInviteSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { email, role } = parsed.data;
  const token = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db.insert(workspaceInvite).values({
    id: randomUUID(),
    workspaceId: context.workspaceId,
    email: email.toLowerCase(),
    role,
    token,
    invitedBy: context.userId,
    expiresAt,
    createdAt: now,
  });

  await publishWorkspaceEvent({
    workspaceId: context.workspaceId,
    type: "workspace_invite_created",
    payload: {
      email,
      role,
      token,
    },
  });

  await createNotification({
    workspaceId: context.workspaceId,
    userId: context.userId,
    type: "invite_created",
    title: `Invite created for ${email}`,
    body: `Role: ${role}`,
    entityType: "invite",
    entityId: token,
  });

  return NextResponse.json({ invite: { token, email, role, expiresAt } });
}
