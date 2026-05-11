import Link from "next/link";
import { format } from "date-fns";
import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { CreateSprintDialog } from "@/components/linear/sprints/create-sprint-dialog";
import { ProjectPlanningLinks } from "@/components/linear/sprints/project-planning-links";
import { db } from "@/lib/db/db";
import { project, sprint } from "@/lib/db/schema";
import { requireWorkspaceContext } from "@/lib/workspaces/access";

export default async function ProjectSprintsPage({
  params,
}: {
  params: Promise<{ slug: string; projectId: string }>;
}) {
  const { slug, projectId } = await params;
  const context = await requireWorkspaceContext(slug);

  const [projectRow] = await db
    .select({
      id: project.id,
      name: project.name,
      key: project.key,
      teamId: project.teamId,
    })
    .from(project)
    .where(and(eq(project.id, projectId), eq(project.workspaceId, context.workspaceId)))
    .limit(1);

  if (!projectRow) {
    notFound();
  }

  const sprintRows = await db
    .select({
      id: sprint.id,
      name: sprint.name,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      status: sprint.status,
    })
    .from(sprint)
    .where(and(eq(sprint.workspaceId, context.workspaceId), eq(sprint.projectId, projectRow.id)))
    .orderBy(desc(sprint.startDate));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{projectRow.name} · Sprints</h1>
          <p className="text-sm text-muted-foreground">Project key: {projectRow.key}</p>
          <div className="mt-3">
            <ProjectPlanningLinks current="sprints" projectId={projectRow.id} slug={slug} />
          </div>
        </div>
        <CreateSprintDialog projectId={projectRow.id} slug={slug} />
      </div>

      {sprintRows.length === 0 ? (
        <p className="text-muted-foreground text-sm">No sprints yet. Create one to plan work by timebox.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {sprintRows.map((row) => (
            <li className="flex flex-wrap items-center justify-between gap-3 p-4" key={row.id}>
              <div>
                <Link
                  className="font-medium hover:underline"
                  href={`/${slug}/project/${projectRow.id}/sprints/${row.id}`}
                >
                  {row.name}
                </Link>
                <p className="text-muted-foreground text-xs">
                  {format(new Date(`${row.startDate}T12:00:00`), "MMM d, yyyy")} →{" "}
                  {format(new Date(`${row.endDate}T12:00:00`), "MMM d, yyyy")} ·{" "}
                  <span className="capitalize">{row.status.replace("_", " ")}</span>
                </p>
              </div>
              <Link
                className="text-muted-foreground text-sm underline-offset-4 hover:underline"
                href={`/${slug}/project/${projectRow.id}/sprints/${row.id}`}
              >
                Open
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
