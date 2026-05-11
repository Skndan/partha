import { and, asc, desc, eq, isNull } from "drizzle-orm";

import { InviteMemberDialog } from "@/components/linear/invite-member-dialog";
import { MembersWorkspaceTabs } from "@/components/workspace/members-workspace-tabs";
import { db } from "@/lib/db/db";
import {
  notification,
  team,
  user,
  workspaceInvite,
  workspaceMember,
} from "@/lib/db/schema";
import { requireWorkspaceContext } from "@/lib/workspaces/access";
import { Heading } from "@workspace/ui/components/heading";

export default async function WorkspaceMembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const context = await requireWorkspaceContext(slug);

  const [members, invites, notifications, teamOptions] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: workspaceMember.role,
        joinedAt: workspaceMember.joinedAt,
      })
      .from(workspaceMember)
      .innerJoin(user, eq(user.id, workspaceMember.userId))
      .where(eq(workspaceMember.workspaceId, context.workspaceId))
      .orderBy(desc(workspaceMember.joinedAt)),
    db
      .select({
        id: workspaceInvite.id,
        email: workspaceInvite.email,
        role: workspaceInvite.role,
        expiresAt: workspaceInvite.expiresAt,
        teamName: team.name,
      })
      .from(workspaceInvite)
      .leftJoin(team, eq(team.id, workspaceInvite.teamId))
      .where(
        and(
          eq(workspaceInvite.workspaceId, context.workspaceId),
          isNull(workspaceInvite.acceptedAt),
        ),
      )
      .orderBy(desc(workspaceInvite.createdAt)),
    db
      .select({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
      })
      .from(notification)
      .where(
        and(
          eq(notification.workspaceId, context.workspaceId),
          eq(notification.userId, context.userId),
        ),
      )
      .orderBy(desc(notification.createdAt))
      .limit(20),
    db
      .select({
        id: team.id,
        name: team.name,
        key: team.key,
      })
      .from(team)
      .where(eq(team.workspaceId, context.workspaceId))
      .orderBy(asc(team.name)),
  ]);

  const membersSerialized = members.map((m) => ({
    ...m,
    joinedAt: m.joinedAt.toISOString(),
  }));

  const invitesSerialized = invites.map((i) => ({
    ...i,
    expiresAt: i.expiresAt.toISOString(),
  }));

  const notificationsSerialized = notifications.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <Heading
        title="Members"
        description="Invite people to this workspace, manage roles, and review pending invitations."
        action={
          <InviteMemberDialog
            slug={slug}
            workspaceName={context.workspaceName}
            teams={teamOptions}
          />
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-muted-foreground text-xs">Members</p>
          <p className="mt-1 font-semibold text-2xl tabular-nums">{members.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-muted-foreground text-xs">Pending invites</p>
          <p className="mt-1 font-semibold text-2xl tabular-nums">{invites.length}</p>
        </div>
      </div>

      <MembersWorkspaceTabs
        members={membersSerialized}
        invites={invitesSerialized}
        notifications={notificationsSerialized}
      />
    </div>
  );
}
