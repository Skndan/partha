import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { loadDataTableSearchParams, normalizeDataTableSearchParams } from "@/components/data-table";
import { IssuePageContent } from "@/components/linear/issue-data-table/issue-page-content";
import { MarkdownDescriptionPreview } from "@/components/linear/markdown-description/markdown-description-preview";
import { ProjectOverviewMilestones } from "@/components/linear/project-overview-milestones";
import { db } from "@/lib/db/db";
import { milestone, project, team } from "@/lib/db/schema";
import { requireWorkspaceContext } from "@/lib/workspaces/access";

import { loadProjectIssuesShellData } from "../issues/_lib/load-project-issues-shell-data";

export default async function ProjectOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; projectId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug, projectId } = await params;
  const context = await requireWorkspaceContext(slug);

  const [projectRow] = await db
    .select({
      id: project.id,
      name: project.name,
      key: project.key,
      description: project.description,
      status: project.status,
      targetDate: project.targetDate,
      teamId: project.teamId,
    })
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

  const [teamRow, milestones, shell] = await Promise.all([
    projectRow.teamId
      ? db
        .select({ key: team.key, name: team.name })
        .from(team)
        .where(eq(team.id, projectRow.teamId))
        .limit(1)
      : Promise.resolve([]),
    db
      .select()
      .from(milestone)
      .where(
        and(
          eq(milestone.workspaceId, context.workspaceId),
          eq(milestone.projectId, projectRow.id),
        ),
      ),
    loadProjectIssuesShellData({
      workspaceId: context.workspaceId,
      projectId: projectRow.id,
      normalizedSearchParams,
    }),
  ]);

  const assignedTeam = teamRow[0] ?? null;
  const { tableData, statuses, members, teams, labels } = shell;
  const milestoneOptions = milestones.map((row) => ({ id: row.id, name: row.name }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{projectRow.name}</h1>
          <p className="text-sm text-muted-foreground">
            {projectRow.key} · {projectRow.status.replace("_", " ")}
          </p>
          {assignedTeam ? (
            <p className="text-sm text-muted-foreground">
              Team:{" "}
              <Link
                className="underline-offset-4 hover:underline"
                href={`/${slug}/team/${assignedTeam.key}/all`}
              >
                {assignedTeam.name}
              </Link>
            </p>
          ) : null}
        </div>
        <Link
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          href={`/${slug}/project/${projectRow.id}/issues`}
        >
          View issues
        </Link>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="text-sm font-medium">Description</h2>
        <MarkdownDescriptionPreview markdown={projectRow.description} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
        <div className="min-w-0 order-2 lg:order-none lg:col-start-1 lg:row-start-1">
          <IssuePageContent
            slug={slug}
            title="Issues"
            description="Filter by milestone in the panel or use the table filters."
            issues={tableData.rows}
            totalCount={tableData.totalCount}
            statuses={statuses}
            teams={teams.map((row) => ({ id: row.id, name: row.name }))}
            projects={[{ id: projectRow.id, name: projectRow.name }]}
            milestones={milestoneOptions}
            members={members}
            labels={labels}
            statusFilterOptions={tableData.statusFilterOptions}
            lockedProjectId={projectRow.id}
            lockedTeamId={projectRow.teamId ?? undefined}
          />
        </div>

        <div className="min-w-0 order-1 lg:order-none lg:col-start-2 lg:row-start-1 max-h-[70vh] overflow-y-auto">
          <ProjectOverviewMilestones
            slug={slug}
            project={{ id: projectRow.id, name: projectRow.name }}
            milestones={milestones}
          />
        </div>
      </div>
    </div>
  );
}
