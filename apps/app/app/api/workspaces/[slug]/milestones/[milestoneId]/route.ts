import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";

import { db } from "@/lib/db/db";
import { milestone, project } from "@/lib/db/schema";
import { UpdateMilestoneSchema } from "@/lib/validators/linear";
import { getWorkspaceApiContext } from "@/lib/workspaces/api-access";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; milestoneId: string }> },
) {
  const { slug, milestoneId } = await params;
  const context = await getWorkspaceApiContext(slug);

  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = UpdateMilestoneSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const [existingMilestone] = await db
    .select({
      id: milestone.id,
      name: milestone.name,
      description: milestone.description,
      projectId: milestone.projectId,
      targetDate: milestone.targetDate,
      status: milestone.status,
    })
    .from(milestone)
    .where(
      and(
        eq(milestone.workspaceId, context.workspaceId),
        eq(milestone.id, milestoneId),
      ),
    )
    .limit(1);

  if (!existingMilestone) {
    return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  }

  if (!Object.keys(parsed.data).length) {
    return NextResponse.json(
      { error: { _form: ["No changes provided"] } },
      { status: 400 },
    );
  }

  const nextName = parsed.data.name ?? existingMilestone.name;
  const nextDescription =
    parsed.data.description !== undefined
      ? (parsed.data.description || null)
      : existingMilestone.description;
  const nextProjectId =
    parsed.data.projectId !== undefined
      ? (parsed.data.projectId || null)
      : existingMilestone.projectId;
  const nextTargetDate =
    parsed.data.targetDate !== undefined
      ? (parsed.data.targetDate || null)
      : existingMilestone.targetDate;
  const nextStatus = parsed.data.status ?? existingMilestone.status;

  const [nameConflict] = await db
    .select({ id: milestone.id })
    .from(milestone)
    .where(
      and(
        eq(milestone.workspaceId, context.workspaceId),
        eq(milestone.name, nextName),
        ne(milestone.id, milestoneId),
      ),
    )
    .limit(1);

  if (nameConflict) {
    return NextResponse.json(
      { error: { name: ["Milestone name already exists"] } },
      { status: 409 },
    );
  }

  if (nextProjectId) {
    const [selectedProject] = await db
      .select({ id: project.id })
      .from(project)
      .where(
        and(eq(project.workspaceId, context.workspaceId), eq(project.id, nextProjectId)),
      )
      .limit(1);

    if (!selectedProject) {
      return NextResponse.json(
        { error: { projectId: ["Invalid project selected"] } },
        { status: 400 },
      );
    }
  }

  await db
    .update(milestone)
    .set({
      name: nextName,
      description: nextDescription,
      projectId: nextProjectId,
      targetDate: nextTargetDate,
      status: nextStatus,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(milestone.workspaceId, context.workspaceId),
        eq(milestone.id, milestoneId),
      ),
    );

  return NextResponse.json({ ok: true });
}
