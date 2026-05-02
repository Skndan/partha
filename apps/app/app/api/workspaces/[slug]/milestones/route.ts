import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/db";
import { milestone, project } from "@/lib/db/schema";
import { CreateMilestoneSchema } from "@/lib/validators/linear";
import { getWorkspaceApiContext } from "@/lib/workspaces/api-access";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const context = await getWorkspaceApiContext(slug);

  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const milestones = await db
    .select()
    .from(milestone)
    .where(eq(milestone.workspaceId, context.workspaceId));

  return NextResponse.json({ milestones });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const context = await getWorkspaceApiContext(slug);

  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = CreateMilestoneSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, description, projectId, status, targetDate } = parsed.data;

  const [nameConflict] = await db
    .select({ id: milestone.id })
    .from(milestone)
    .where(and(eq(milestone.workspaceId, context.workspaceId), eq(milestone.name, name)))
    .limit(1);

  if (nameConflict) {
    return NextResponse.json(
      { error: { name: ["Milestone name already exists"] } },
      { status: 409 },
    );
  }

  if (projectId) {
    const [selectedProject] = await db
      .select({ id: project.id })
      .from(project)
      .where(
        and(eq(project.workspaceId, context.workspaceId), eq(project.id, projectId)),
      )
      .limit(1);

    if (!selectedProject) {
      return NextResponse.json(
        { error: { projectId: ["Invalid project selected"] } },
        { status: 400 },
      );
    }
  }

  const now = new Date();
  const id = randomUUID();
  await db.insert(milestone).values({
    id,
    workspaceId: context.workspaceId,
    projectId: projectId || null,
    name,
    description: description || null,
    targetDate: targetDate || null,
    status,
    createdBy: context.userId,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ milestone: { id, name } });
}
