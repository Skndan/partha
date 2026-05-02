import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { loadDataTableSearchParams, normalizeDataTableSearchParams } from "@/components/data-table";
import { IssuePageContent } from "@/components/linear/issue-data-table/issue-page-content";
import { db } from "@/lib/db/db";
import {
  issueLabel,
  issueStatus,
  milestone,
  project,
  team,
  user,
  workspaceMember,
} from "@/lib/db/schema";
import { requireWorkspaceContext } from "@/lib/workspaces/access";
import { getProjectIssuesForDataTable } from "./_lib/query-project-issues";

export default async function ProjectIssuesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; projectId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug, projectId } = await params;
  const context = await requireWorkspaceContext(slug);

  const [projectRow] = await db
    .select({ id: project.id, name: project.name, key: project.key, teamId: project.teamId })
    .from(project)
    .where(and(eq(project.id, projectId), eq(project.workspaceId, context.workspaceId)))
    .limit(1);

  if (!projectRow) {
    notFound();
  }

  const parsedSearchParams = await loadDataTableSearchParams(searchParams);
  const normalizedSearchParams = normalizeDataTableSearchParams(parsedSearchParams, {
    defaultSort: "identifier",
    defaultOrder: "asc",
    defaultPageSize: 10,
    pageSizeOptions: [10, 20, 30, 40, 50],
  });

  const [tableData, statuses, milestones, members, teams, labels] = await Promise.all([
    getProjectIssuesForDataTable(context.workspaceId, projectRow.id, normalizedSearchParams),
    db
      .select({ id: issueStatus.id, name: issueStatus.name })
      .from(issueStatus)
      .where(eq(issueStatus.workspaceId, context.workspaceId)),
    db
      .select({ id: milestone.id, name: milestone.name })
      .from(milestone)
      .where(
        and(eq(milestone.workspaceId, context.workspaceId), eq(milestone.projectId, projectRow.id)),
      ),
    db
      .select({ id: user.id, name: user.name })
      .from(workspaceMember)
      .innerJoin(user, eq(user.id, workspaceMember.userId))
      .where(eq(workspaceMember.workspaceId, context.workspaceId)),
    db
      .select({ id: team.id, key: team.key, name: team.name })
      .from(team)
      .where(eq(team.workspaceId, context.workspaceId)),
    db
      .select({ id: issueLabel.id, name: issueLabel.name, color: issueLabel.color })
      .from(issueLabel)
      .where(eq(issueLabel.workspaceId, context.workspaceId)),
  ]);

  const teamById = new Map(teams.map((item) => [item.id, item]));

  const projectTeam = projectRow.teamId ? teamById.get(projectRow.teamId) ?? null : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{projectRow.name} Issues</h1>
          <p className="text-sm text-muted-foreground">Project key: {projectRow.key}</p>
          {projectTeam ? (
            <p className="text-sm text-muted-foreground">Team: {projectTeam.name}</p>
          ) : null}
        </div>
        <Link
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          href={`/${slug}/project/${projectRow.id}/overview`}
        >
          Back to overview
        </Link>
      </div>

      <IssuePageContent
        slug={slug}
        title="Project issues"
        description="Manage issues linked to this project."
        issues={tableData.rows}
        totalCount={tableData.totalCount}
        statuses={statuses}
        teams={teams.map((row) => ({ id: row.id, name: row.name }))}
        projects={[{ id: projectRow.id, name: projectRow.name }]}
        milestones={milestones}
        members={members}
        labels={labels}
        statusFilterOptions={tableData.statusFilterOptions}
        lockedProjectId={projectRow.id}
        lockedTeamId={projectRow.teamId ?? undefined}
      />
    </div>
  );
}
