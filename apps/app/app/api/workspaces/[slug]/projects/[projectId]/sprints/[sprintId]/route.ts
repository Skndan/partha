import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/lib/db/db";
import {
  issue,
  issueStatus,
  project,
  sprint,
  sprintIssue,
  user,
} from "@/lib/db/schema";
import { UpdateSprintSchema } from "@/lib/validators/linear";
import { getWorkspaceApiContext } from "@/lib/workspaces/api-access";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; projectId: string; sprintId: string }> },
) {
  const { slug, projectId, sprintId } = await params;
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

  const [sprintRow] = await db
    .select()
    .from(sprint)
    .where(
      and(
        eq(sprint.id, sprintId),
        eq(sprint.workspaceId, context.workspaceId),
        eq(sprint.projectId, projectId),
      ),
    )
    .limit(1);

  if (!sprintRow) {
    return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
  }

  const issueRows = await db
    .select({
      sprintIssueId: sprintIssue.id,
      position: sprintIssue.position,
      issueId: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      statusId: issue.statusId,
      statusName: issueStatus.name,
      statusType: issueStatus.type,
      statusColor: issueStatus.color,
      priority: issue.priority,
      assigneeId: issue.assigneeId,
      teamId: issue.teamId,
      projectId: issue.projectId,
      parentIssueId: issue.parentIssueId,
      startDate: issue.startDate,
      dueDate: issue.dueDate,
      estimate: issue.estimate,
      assigneeName: user.name,
      assigneeEmail: user.email,
    })
    .from(sprintIssue)
    .innerJoin(issue, eq(issue.id, sprintIssue.issueId))
    .innerJoin(issueStatus, eq(issueStatus.id, issue.statusId))
    .leftJoin(user, eq(user.id, issue.assigneeId))
    .where(eq(sprintIssue.sprintId, sprintId))
    .orderBy(asc(sprintIssue.position));

  return NextResponse.json({
    sprint: sprintRow,
    issues: issueRows,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; projectId: string; sprintId: string }> },
) {
  const { slug, projectId, sprintId } = await params;
  const context = await getWorkspaceApiContext(slug);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [existing] = await db
    .select()
    .from(sprint)
    .where(
      and(
        eq(sprint.id, sprintId),
        eq(sprint.workspaceId, context.workspaceId),
        eq(sprint.projectId, projectId),
      ),
    )
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = UpdateSprintSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const nextStart = data.startDate ?? existing.startDate;
  const nextEnd = data.endDate ?? existing.endDate;
  if (nextEnd < nextStart) {
    return NextResponse.json(
      { error: { endDate: ["End date must be on or after start date"] } },
      { status: 400 },
    );
  }

  await db
    .update(sprint)
    .set({
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.goal !== undefined ? { goal: data.goal } : {}),
      ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
      ...(data.endDate !== undefined ? { endDate: data.endDate } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      updatedAt: new Date(),
    })
    .where(eq(sprint.id, sprintId));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string; projectId: string; sprintId: string }> },
) {
  const { slug, projectId, sprintId } = await params;
  const context = await getWorkspaceApiContext(slug);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await db
    .delete(sprint)
    .where(
      and(
        eq(sprint.id, sprintId),
        eq(sprint.workspaceId, context.workspaceId),
        eq(sprint.projectId, projectId),
      ),
    )
    .returning({ id: sprint.id });

  if (!deleted.length) {
    return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
