import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";

import { db } from "@/lib/db/db";
import { project, team } from "@/lib/db/schema";
import { UpdateProjectSchema } from "@/lib/validators/linear";
import { getWorkspaceApiContext } from "@/lib/workspaces/api-access";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; projectId: string }> },
) {
  const { slug, projectId } = await params;
  const context = await getWorkspaceApiContext(slug);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = UpdateProjectSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const [existing] = await db
    .select({ id: project.id })
    .from(project)
    .where(and(eq(project.workspaceId, context.workspaceId), eq(project.id, projectId)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { name, description, status, targetDate, teamId } = parsed.data;

  const [nameConflict] = await db
    .select({ id: project.id })
    .from(project)
    .where(
      and(
        eq(project.workspaceId, context.workspaceId),
        eq(project.name, name),
        ne(project.id, projectId),
      ),
    )
    .limit(1);

  if (nameConflict) {
    return NextResponse.json(
      { error: { name: ["Project name already exists"] } },
      { status: 409 },
    );
  }

  if (teamId) {
    const [selectedTeam] = await db
      .select({ id: team.id })
      .from(team)
      .where(and(eq(team.workspaceId, context.workspaceId), eq(team.id, teamId)))
      .limit(1);

    if (!selectedTeam) {
      return NextResponse.json({ error: "Invalid team selected" }, { status: 400 });
    }
  }

  await db
    .update(project)
    .set({
      name,
      description: description || null,
      status,
      targetDate: targetDate || null,
      teamId: teamId || null,
      updatedAt: new Date(),
    })
    .where(and(eq(project.workspaceId, context.workspaceId), eq(project.id, projectId)));

  return NextResponse.json({ ok: true });
}
