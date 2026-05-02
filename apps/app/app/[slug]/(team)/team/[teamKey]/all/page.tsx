import Link from "next/link";
import { and, count, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db/db";
import { issue, milestone, project, teamMember } from "@/lib/db/schema";
import { requireTeamContextFromKey } from "@/lib/workspaces/team-context";

export default async function TeamDashboardPage({
  params,
}: {
  params: Promise<{ slug: string; teamKey: string }>;
}) {
  const { slug, teamKey } = await params;
  const context = await requireTeamContextFromKey(slug, teamKey);

  const teamProjects = await db
    .select({ id: project.id })
    .from(project)
    .where(
      and(
        eq(project.workspaceId, context.workspaceId),
        eq(project.teamId, context.teamId),
      ),
    );
  const projectIds = teamProjects.map((item) => item.id);

  const [projectCount, issueCount, memberCount, milestoneCountRows] = await Promise.all([
    db
      .select({ value: count() })
      .from(project)
      .where(
        and(
          eq(project.workspaceId, context.workspaceId),
          eq(project.teamId, context.teamId),
        ),
      ),
    db
      .select({ value: count() })
      .from(issue)
      .where(and(eq(issue.workspaceId, context.workspaceId), eq(issue.teamId, context.teamId))),
    db
      .select({ value: count() })
      .from(teamMember)
      .where(eq(teamMember.teamId, context.teamId)),
    projectIds.length
      ? db
        .select({ value: count() })
        .from(milestone)
        .where(
          and(
            eq(milestone.workspaceId, context.workspaceId),
            inArray(milestone.projectId, projectIds),
          ),
        )
      : Promise.resolve([{ value: 0 }]),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{context.teamName}</h1>
          <p className="text-sm text-muted-foreground">Team key: {context.teamKey}</p>
        </div>
        <Link
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          href={`/${slug}/teams`}
        >
          Back to teams
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground">Projects</p>
          <p className="mt-1 text-2xl font-semibold">{projectCount[0]?.value ?? 0}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground">Issues</p>
          <p className="mt-1 text-2xl font-semibold">{issueCount[0]?.value ?? 0}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground">Milestones</p>
          <p className="mt-1 text-2xl font-semibold">{milestoneCountRows[0]?.value ?? 0}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground">Members</p>
          <p className="mt-1 text-2xl font-semibold">{memberCount[0]?.value ?? 0}</p>
        </div>
      </div>
    </div>
  );
}
