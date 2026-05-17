import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db/db";
import { project, sprint, sprintIssue } from "@/lib/db/schema";
import { CreateSprintSchema } from "@/lib/validators/linear";
import { getWorkspaceApiContext } from "@/lib/workspaces/api-access";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; projectId: string }> },
) {
  const { slug, projectId } = await params;
  const context = await getWorkspaceApiContext(slug);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [proj] = await db
    .select({ id: project.id })
    .from(project)
    .where(and(eq(project.workspaceId, context.workspaceId), eq(project.id, projectId)))
    .limit(1);

  if (!proj) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const rows = await db
    .select({
      id: sprint.id,
      name: sprint.name,
      goal: sprint.goal,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      status: sprint.status,
      createdAt: sprint.createdAt,
      updatedAt: sprint.updatedAt,
    })
    .from(sprint)
    .where(and(eq(sprint.workspaceId, context.workspaceId), eq(sprint.projectId, projectId)))
    .orderBy(sprint.startDate);

  const sprintIds = rows.map((r) => r.id);
  const counts =
    sprintIds.length === 0
      ? []
      : await db
        .select({ sprintId: sprintIssue.sprintId })
        .from(sprintIssue)
        .where(inArray(sprintIssue.sprintId, sprintIds));

  const countBySprint = new Map<string, number>();
  for (const row of counts) {
    countBySprint.set(row.sprintId, (countBySprint.get(row.sprintId) ?? 0) + 1);
  }

  return NextResponse.json({
    sprints: rows.map((r) => ({
      ...r,
      issueCount: countBySprint.get(r.id) ?? 0,
    })),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; projectId: string }> },
) {
  const { slug, projectId } = await params;
  const context = await getWorkspaceApiContext(slug);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [proj] = await db
    .select({ id: project.id })
    .from(project)
    .where(and(eq(project.workspaceId, context.workspaceId), eq(project.id, projectId)))
    .limit(1);

  if (!proj) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = CreateSprintSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const id = randomUUID();
  const now = new Date();

  await db.insert(sprint).values({
    id,
    workspaceId: context.workspaceId,
    projectId,
    name: data.name,
    goal: data.goal ?? null,
    startDate: data.startDate,
    endDate: data.endDate,
    status: data.status ?? "planned",
    createdBy: context.userId,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({
    sprint: {
      id,
      name: data.name,
      goal: data.goal ?? null,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status ?? "planned",
    },
  });
}
