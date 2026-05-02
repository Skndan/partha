import { and, eq } from "drizzle-orm";

import { loadDataTableSearchParams, normalizeDataTableSearchParams } from "@/components/data-table";
import { IssuePageContent } from "@/components/linear/issue-data-table/issue-page-content";
import { db } from "@/lib/db/db";
import { issueLabel, issueStatus, milestone, project, user, workspaceMember } from "@/lib/db/schema";
import { requireTeamContextFromKey } from "@/lib/workspaces/team-context";
import { getTeamIssuesForDataTable } from "./_lib/query-team-issues";

export default async function TeamIssuesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; teamKey: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug, teamKey } = await params;
  const context = await requireTeamContextFromKey(slug, teamKey);

  const parsedSearchParams = await loadDataTableSearchParams(searchParams);
  const normalizedSearchParams = normalizeDataTableSearchParams(parsedSearchParams, {
    defaultSort: "identifier",
    defaultOrder: "asc",
    defaultPageSize: 10,
    pageSizeOptions: [10, 20, 30, 40, 50],
  });

  const [tableData, statuses, projects, milestones, members, labels] = await Promise.all([
    getTeamIssuesForDataTable(context.workspaceId, context.teamId, normalizedSearchParams),
    db
      .select({ id: issueStatus.id, name: issueStatus.name })
      .from(issueStatus)
      .where(eq(issueStatus.workspaceId, context.workspaceId)),
    db
      .select({ id: project.id, name: project.name })
      .from(project)
      .where(
        and(
          eq(project.workspaceId, context.workspaceId),
          eq(project.teamId, context.teamId),
        ),
      ),
    db
      .select({ id: milestone.id, name: milestone.name })
      .from(milestone)
      .where(eq(milestone.workspaceId, context.workspaceId)),
    db
      .select({ id: user.id, name: user.name })
      .from(workspaceMember)
      .innerJoin(user, eq(user.id, workspaceMember.userId))
      .where(eq(workspaceMember.workspaceId, context.workspaceId)),
    db
      .select({ id: issueLabel.id, name: issueLabel.name, color: issueLabel.color })
      .from(issueLabel)
      .where(eq(issueLabel.workspaceId, context.workspaceId)),
  ]);

  return (
    <IssuePageContent
      slug={slug}
      title={`${context.teamName} Issues`}
      description="Track issue delivery for this team."
      issues={tableData.rows}
      totalCount={tableData.totalCount}
      statuses={statuses}
      teams={[{ id: context.teamId, name: context.teamName }]}
      projects={projects}
      milestones={milestones}
      members={members}
      labels={labels}
      statusFilterOptions={tableData.statusFilterOptions}
      lockedTeamId={context.teamId}
    />
  );
}
