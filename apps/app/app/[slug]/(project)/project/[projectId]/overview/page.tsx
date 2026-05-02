import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { ProjectOverviewMilestones } from "@/components/linear/project-overview-milestones";
import { db } from "@/lib/db/db";
import { milestone, project, team } from "@/lib/db/schema";
import { requireWorkspaceContext } from "@/lib/workspaces/access";

export default async function ProjectOverviewPage({
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

  const [teamRow, milestones] = await Promise.all([
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
  ]);

  const assignedTeam = teamRow[0] ?? null;

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
        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
          {projectRow.description || "No description provided."}
        </p>
      </div>

      <ProjectOverviewMilestones
        slug={slug}
        project={{ id: projectRow.id, name: projectRow.name }}
        milestones={milestones}
      />
    </div>
  );
}
