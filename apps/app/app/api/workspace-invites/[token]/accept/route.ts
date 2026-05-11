import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import {
  teamMember,
  workspace,
  workspaceInvite,
  workspaceMember,
} from "@/lib/db/schema";
import { publishWorkspaceEvent } from "@/lib/workspaces/realtime";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [invite] = await db
    .select()
    .from(workspaceInvite)
    .where(and(eq(workspaceInvite.token, token), isNull(workspaceInvite.acceptedAt)))
    .limit(1);

  if (!invite) {
    return NextResponse.json({ error: "Invite not found or already accepted" }, { status: 404 });
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invite expired" }, { status: 410 });
  }

  if ((session.user.email ?? "").toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json(
      { error: "Invite email does not match current account" },
      { status: 403 },
    );
  }

  const [existingMembership] = await db
    .select({ id: workspaceMember.id })
    .from(workspaceMember)
    .where(
      and(
        eq(workspaceMember.workspaceId, invite.workspaceId),
        eq(workspaceMember.userId, session.user.id),
      ),
    )
    .limit(1);

  if (!existingMembership) {
    await db.insert(workspaceMember).values({
      id: randomUUID(),
      workspaceId: invite.workspaceId,
      userId: session.user.id,
      role: invite.role,
      joinedAt: new Date(),
    });
  }

  if (invite.teamId) {
    const [existingTeamMember] = await db
      .select({ id: teamMember.id })
      .from(teamMember)
      .where(
        and(eq(teamMember.teamId, invite.teamId), eq(teamMember.userId, session.user.id)),
      )
      .limit(1);

    if (!existingTeamMember) {
      await db.insert(teamMember).values({
        id: randomUUID(),
        teamId: invite.teamId,
        userId: session.user.id,
        role: "member",
        createdAt: new Date(),
      });
    }
  }

  await db
    .update(workspaceInvite)
    .set({ acceptedAt: new Date() })
    .where(eq(workspaceInvite.id, invite.id));

  const [workspaceRow] = await db
    .select({ slug: workspace.slug })
    .from(workspace)
    .where(eq(workspace.id, invite.workspaceId))
    .limit(1);

  await publishWorkspaceEvent({
    workspaceId: invite.workspaceId,
    type: "workspace_invite_accepted",
    payload: {
      token,
      userId: session.user.id,
    },
  });

  return NextResponse.json({
    ok: true,
    slug: workspaceRow?.slug ?? null,
  });
}
