import { and, desc, eq, isNull } from "drizzle-orm";

import { InviteMemberDialog } from "@/components/linear/invite-member-dialog";
import { db } from "@/lib/db/db";
import {
  notification,
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

  const [members, invites, notifications] = await Promise.all([
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
      })
      .from(workspaceInvite)
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
  ]);

  return (
    <div className="space-y-6">
      <Heading
        title="Members & Invites"
        description="Invite teammates, manage access, and track workspace notifications."
        action={<InviteMemberDialog slug={slug} />}
      />

      <div className="rounded-lg border">
        <div className="border-b bg-muted/50 p-3 text-sm font-medium rounded-t-lg">Members</div>
        <div className="divide-y">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-muted-foreground">{member.email}</p>
              </div>
              <div className="text-right">
                <p className="capitalize">{member.role}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(member.joinedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="border-b bg-muted/50 p-3 text-sm font-medium rounded-t-lg">Pending invites</div>
        <div className="divide-y">
          {invites.map((invite) => (
            <div key={invite.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <p className="font-medium">{invite.email}</p>
                <p className="text-muted-foreground capitalize">{invite.role}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Expires {new Date(invite.expiresAt).toLocaleDateString()}
              </p>
            </div>
          ))}
          {!invites.length ? (
            <p className="p-3 text-sm text-muted-foreground">No pending invites.</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="border-b bg-muted/50 p-3 text-sm font-medium rounded-t-lg">My notifications</div>
        <div className="divide-y">
          {notifications.map((item) => (
            <div key={item.id} className="p-3 text-sm">
              <p className="font-medium">{item.title}</p>
              <p className="text-muted-foreground">{item.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
          {!notifications.length ? (
            <p className="p-3 text-sm text-muted-foreground">No notifications yet.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
