import Link from "next/link";
import { format } from "date-fns";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { AddSprintIssuesDialog } from "@/components/linear/sprints/add-sprint-issues-dialog";
import { DeleteSprintButton } from "@/components/linear/sprints/delete-sprint-button";
import { ProjectPlanningLinks } from "@/components/linear/sprints/project-planning-links";
import { SprintIssueRemoveButton } from "@/components/linear/sprints/sprint-issue-remove-button";
import { SprintPlanningTabs } from "@/components/linear/sprints/sprint-planning-tabs";
import { db } from "@/lib/db/db";
import { issue, issueStatus, project, sprint, sprintIssue } from "@/lib/db/schema";
import { requireWorkspaceContext } from "@/lib/workspaces/access";

export default async function SprintDetailPage({
  params,
}: {
  params: Promise<{ slug: string; projectId: string; sprintId: string }>;
}) {
  const { slug, projectId, sprintId } = await params;
  const context = await requireWorkspaceContext(slug);

  const [projectRow] = await db
    .select({
      id: project.id,
      name: project.name,
      key: project.key,
    })
    .from(project)
    .where(and(eq(project.id, projectId), eq(project.workspaceId, context.workspaceId)))
    .limit(1);

  if (!projectRow) {
    notFound();
  }

  const [sprintRow] = await db
    .select()
    .from(sprint)
    .where(
      and(
        eq(sprint.id, sprintId),
        eq(sprint.workspaceId, context.workspaceId),
        eq(sprint.projectId, projectRow.id),
      ),
    )
    .limit(1);

  if (!sprintRow) {
    notFound();
  }

  const [issueRows, statusRows] = await Promise.all([
    db
      .select({
        issueId: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        statusId: issue.statusId,
        statusName: issueStatus.name,
        statusColor: issueStatus.color,
        startDate: issue.startDate,
        dueDate: issue.dueDate,
      })
      .from(sprintIssue)
      .innerJoin(issue, eq(issue.id, sprintIssue.issueId))
      .innerJoin(issueStatus, eq(issueStatus.id, issue.statusId))
      .where(eq(sprintIssue.sprintId, sprintId))
      .orderBy(asc(sprintIssue.position)),
    db
      .select({
        id: issueStatus.id,
        name: issueStatus.name,
        position: issueStatus.position,
        type: issueStatus.type,
      })
      .from(issueStatus)
      .where(eq(issueStatus.workspaceId, context.workspaceId))
      .orderBy(asc(issueStatus.position)),
  ]);

  const sprintIssueIds = issueRows.map((r) => r.issueId);

  const kanbanColumns = statusRows.map((s) => ({
    id: s.id,
    name: s.name,
  }));

  const kanbanItems = issueRows.map((row) => ({
    id: row.issueId,
    name: row.title,
    column: row.statusId,
    identifier: row.identifier,
  }));

  const ganttIssues = issueRows.map((row) => ({
    id: row.issueId,
    identifier: row.identifier,
    title: row.title,
    statusId: row.statusId,
    statusName: row.statusName,
    statusColor: row.statusColor,
    startDate: row.startDate,
    dueDate: row.dueDate,
  }));

  const issuesFingerprint = `${sprintRow.updatedAt?.toISOString?.() ?? ""}-${issueRows
    .map((r) => `${r.issueId}:${r.statusId}:${r.startDate ?? ""}:${r.dueDate ?? ""}`)
    .join("|")}`;

  const sprintStartMarkerLabel = "Sprint start";
  const sprintEndMarkerLabel = "Sprint end";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">
            <Link className="underline-offset-4 hover:underline" href={`/${slug}/project/${projectRow.id}/sprints`}>
              ← All sprints
            </Link>
            <span aria-hidden="true" className="mx-2">
              ·
            </span>
            {projectRow.name}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{sprintRow.name}</h1>
          <p className="text-muted-foreground text-sm">
            {format(new Date(`${sprintRow.startDate}T12:00:00`), "MMM d, yyyy")} →{" "}
            {format(new Date(`${sprintRow.endDate}T12:00:00`), "MMM d, yyyy")} ·{" "}
            <span className="capitalize">{sprintRow.status.replace("_", " ")}</span>
          </p>
          {sprintRow.goal ? <p className="max-w-2xl text-sm">{sprintRow.goal}</p> : null}
          <div className="pt-1">
            <ProjectPlanningLinks current="sprints" projectId={projectRow.id} slug={slug} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <AddSprintIssuesDialog
            projectId={projectRow.id}
            slug={slug}
            sprintId={sprintRow.id}
            sprintIssueIds={sprintIssueIds}
          />
          <DeleteSprintButton projectId={projectRow.id} slug={slug} sprintId={sprintRow.id} />
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-medium text-sm">Issues in sprint</h2>
        {issueRows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No issues yet. Add issues that belong to this project.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-muted-foreground text-xs">
                <tr>
                  <th className="px-3 py-2 font-medium">Issue</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {issueRows.map((row) => (
                  <tr key={row.issueId}>
                    <td className="px-3 py-2">
                      <Link
                        className="font-mono text-muted-foreground text-xs underline-offset-4 hover:underline"
                        href={`/${slug}/issues/${row.issueId}`}
                      >
                        {row.identifier}
                      </Link>
                      <span className="ml-2">{row.title}</span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{row.statusName}</td>
                    <td className="px-3 py-2 text-right">
                      <SprintIssueRemoveButton
                        issueId={row.issueId}
                        projectId={projectRow.id}
                        slug={slug}
                        sprintId={sprintRow.id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-medium text-sm">Planning boards</h2>
        <SprintPlanningTabs
          ganttIssues={ganttIssues}
          issuesFingerprint={issuesFingerprint}
          kanbanColumns={kanbanColumns}
          kanbanItems={kanbanItems}
          slug={slug}
          sprintEnd={sprintRow.endDate}
          sprintEndMarkerLabel={sprintEndMarkerLabel}
          sprintStart={sprintRow.startDate}
          sprintStartMarkerLabel={sprintStartMarkerLabel}
        />
      </section>
    </div>
  );
}
