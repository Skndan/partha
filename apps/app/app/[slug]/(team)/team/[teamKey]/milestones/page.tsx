import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db/db";
import { milestone, project } from "@/lib/db/schema";
import { requireTeamContextFromKey } from "@/lib/workspaces/team-context";

export default async function TeamMilestonesPage({
  params,
}: {
  params: Promise<{ slug: string; teamKey: string }>;
}) {
  const { slug, teamKey } = await params;
  const context = await requireTeamContextFromKey(slug, teamKey);

  const teamProjects = await db
    .select({ id: project.id, name: project.name })
    .from(project)
    .where(
      and(
        eq(project.workspaceId, context.workspaceId),
        eq(project.teamId, context.teamId),
      ),
    );
  const projectIds = teamProjects.map((item) => item.id);
  const projectMap = new Map(teamProjects.map((item) => [item.id, item.name]));

  const milestones = projectIds.length
    ? await db
      .select()
      .from(milestone)
      .where(
        and(
          eq(milestone.workspaceId, context.workspaceId),
          inArray(milestone.projectId, projectIds),
        ),
      )
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {context.teamName} Milestones
        </h1>
        <p className="text-sm text-muted-foreground">
          Milestones for projects owned by this team.
        </p>
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="p-3 font-medium">Milestone</th>
              <th className="p-3 font-medium">Project</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Target Date</th>
            </tr>
          </thead>
          <tbody>
            {milestones.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-3">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.description ?? "-"}</p>
                </td>
                <td className="p-3">{item.projectId ? projectMap.get(item.projectId) ?? "-" : "-"}</td>
                <td className="p-3 capitalize">{item.status.replace("_", " ")}</td>
                <td className="p-3">{item.targetDate ?? "-"}</td>
              </tr>
            ))}
            {!milestones.length ? (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={4}>
                  No milestones for this team yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
