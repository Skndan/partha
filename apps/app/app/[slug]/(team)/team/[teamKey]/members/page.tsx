import { eq } from "drizzle-orm";
import { UserRoundIcon } from "lucide-react";

import { db } from "@/lib/db/db";
import { teamMember, user } from "@/lib/db/schema";
import { requireTeamContextFromKey } from "@/lib/workspaces/team-context";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";

export default async function TeamMembersPage({
  params,
}: {
  params: Promise<{ slug: string; teamKey: string }>;
}) {
  const { teamKey, slug } = await params;
  const context = await requireTeamContextFromKey(slug, teamKey);

  const members = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: teamMember.role,
      addedAt: teamMember.createdAt,
    })
    .from(teamMember)
    .innerJoin(user, eq(user.id, teamMember.userId))
    .where(eq(teamMember.teamId, context.teamId));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{context.teamName} Members</h1>
        <p className="text-sm text-muted-foreground">People assigned to this team.</p>
      </div>

      {members.length > 0 ? (
        <div className="rounded-lg border">
          <div className="border-b p-3 text-sm font-medium">Team members</div>
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
                    Added {new Date(member.addedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserRoundIcon />
            </EmptyMedia>
            <EmptyTitle>No team members yet</EmptyTitle>
            <EmptyDescription>Invite or assign members to start collaborating as a team.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
