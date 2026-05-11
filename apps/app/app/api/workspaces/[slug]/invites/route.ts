import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/lib/db/db";
import { team, workspace, workspaceInvite } from "@/lib/db/schema";
import { isSmtpConfigured, sendWorkspaceInviteEmail } from "@/lib/email/send-email";
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

  const { email, role, teamId: requestedTeamId } = parsed.data;

  let resolvedTeamId: string | null = null;
  let teamName: string | null = null;
  if (requestedTeamId) {
    const [teamRow] = await db
      .select({ id: team.id, name: team.name })
      .from(team)
      .where(and(eq(team.id, requestedTeamId), eq(team.workspaceId, context.workspaceId)))
      .limit(1);
    if (!teamRow) {
      return NextResponse.json({ error: "Team not found in this workspace" }, { status: 400 });
    }
    resolvedTeamId = teamRow.id;
    teamName = teamRow.name;
  }

  const [workspaceRow] = await db
    .select({ name: workspace.name })
    .from(workspace)
    .where(eq(workspace.id, context.workspaceId))
    .limit(1);

  const workspaceName = workspaceRow?.name ?? context.workspaceSlug;

  const token = randomUUID();
  const inviteId = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db.insert(workspaceInvite).values({
    id: inviteId,
    workspaceId: context.workspaceId,
    email: email.toLowerCase(),
    role,
    token,
    invitedBy: context.userId,
    teamId: resolvedTeamId,
    expiresAt,
    createdAt: now,
  });

  const hasSmtp = isSmtpConfigured();
  if (hasSmtp) {
    try {
      await sendWorkspaceInviteEmail({
        to: email.toLowerCase(),
        workspaceName,
        workspaceSlug: context.workspaceSlug,
        role,
        teamName,
        expiresAt,
      });
    } catch (error) {
      console.error("workspace_invite_email_failed", error);
      await db.delete(workspaceInvite).where(eq(workspaceInvite.id, inviteId));
      return NextResponse.json(
        { error: "Invite was not created because the invitation email could not be sent." },
        { status: 500 },
      );
    }
  }

  await publishWorkspaceEvent({
    workspaceId: context.workspaceId,
    type: "workspace_invite_created",
    payload: {
      email,
      role,
      token,
      workspaceSlug: context.workspaceSlug,
      teamId: resolvedTeamId,
    },
  });

  const inviteBodyParts = [`Role: ${role}`, `Workspace: ${workspaceName}`];
  if (teamName) inviteBodyParts.push(`Team: ${teamName}`);

  await createNotification({
    workspaceId: context.workspaceId,
    userId: context.userId,
    type: "invite_created",
    title: `Invite created for ${email}`,
    body: inviteBodyParts.join(" · "),
    entityType: "invite",
    entityId: token,
  });

  return NextResponse.json({
    invite: {
      token,
      email,
      role,
      expiresAt,
      teamId: resolvedTeamId,
    },
    emailSent: hasSmtp,
    ...(hasSmtp
      ? {}
      : {
        warning:
          "SMTP is not configured. The invite was saved but no email was sent. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM to email invites.",
      }),
  });
}
