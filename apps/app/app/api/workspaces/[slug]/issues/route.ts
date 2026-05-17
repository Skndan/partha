import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { and, count, eq } from "drizzle-orm";

import { db } from "@/lib/db/db";
import {
  activityEvent,
  issue,
  issueAssignee,
  issueLabelLink,
} from "@/lib/db/schema";
import {
  getProjectRecord,
  getStatusRecord,
  resolveCompletedAtForCreate,
  validateAssignee,
  validateLabelIds,
  validateMilestoneForProject,
  validateParentIssue,
  validateTeam,
} from "@/lib/linear/issue-mutations";
import { CreateIssueSchema } from "@/lib/validators/linear";
import { getWorkspaceApiContext } from "@/lib/workspaces/api-access";
import { createNotification } from "@/lib/workspaces/notifications";
import { publishWorkspaceEvent } from "@/lib/workspaces/realtime";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const context = await getWorkspaceApiContext(slug);

  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const issues = await db
    .select({
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      statusId: issue.statusId,
      priority: issue.priority,
      dueDate: issue.dueDate,
      assigneeId: issue.assigneeId,
      projectId: issue.projectId,
      milestoneId: issue.milestoneId,
      teamId: issue.teamId,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    })
    .from(issue)
    .where(eq(issue.workspaceId, context.workspaceId));

  return NextResponse.json({ issues });
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
  const parsed = CreateIssueSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;
  let projectKey: string | null = null;

  const statusRow = await getStatusRecord(context.workspaceId, data.statusId);
  if (!statusRow) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (data.teamId && !(await validateTeam(context.workspaceId, data.teamId))) {
    return NextResponse.json({ error: "Invalid team" }, { status: 400 });
  }

  if (data.projectId) {
    const row = await getProjectRecord(context.workspaceId, data.projectId);
    if (!row) return NextResponse.json({ error: "Invalid project" }, { status: 400 });
    projectKey = row.key;
  }

  if (data.milestoneId) {
    if (!data.projectId) {
      return NextResponse.json(
        { error: "Milestone can only be assigned to a project issue" },
        { status: 400 },
      );
    }

    const validMilestone = await validateMilestoneForProject(
      context.workspaceId,
      data.milestoneId,
      data.projectId,
    );
    if (!validMilestone) {
      return NextResponse.json(
        { error: "Invalid milestone for the selected project" },
        { status: 400 },
      );
    }
  }

  if (data.assigneeId && !(await validateAssignee(context.workspaceId, data.assigneeId))) {
    return NextResponse.json({ error: "Invalid assignee" }, { status: 400 });
  }

  if (!(await validateLabelIds(context.workspaceId, data.labelIds))) {
    return NextResponse.json({ error: "Invalid label selected" }, { status: 400 });
  }

  if (data.parentIssueId) {
    const parentValidation = await validateParentIssue({
      workspaceId: context.workspaceId,
      parentIssueId: data.parentIssueId,
    });
    if (!parentValidation.ok) {
      return NextResponse.json({ error: parentValidation.error }, { status: 400 });
    }
  }

  const [counter] =
    data.projectId && projectKey
      ? await db
        .select({ value: count() })
        .from(issue)
        .where(and(eq(issue.workspaceId, context.workspaceId), eq(issue.projectId, data.projectId)))
      : await db
        .select({ value: count() })
        .from(issue)
        .where(eq(issue.workspaceId, context.workspaceId));

  const number = (counter?.value ?? 0) + 1;
  const identifier = `${(projectKey ?? context.workspaceSlug).toUpperCase()}-${number}`;
  const now = new Date();
  const issueId = randomUUID();
  const completedAt = resolveCompletedAtForCreate(statusRow.type, now);

  await db.transaction(async (tx) => {
    await tx.insert(issue).values({
      id: issueId,
      workspaceId: context.workspaceId,
      teamId: data.teamId || null,
      projectId: data.projectId || null,
      milestoneId: data.milestoneId || null,
      parentIssueId: data.parentIssueId || null,
      identifier,
      title: data.title,
      description: data.description,
      acceptanceCriteria: data.acceptanceCriteria ?? [],
      statusId: data.statusId,
      priority: data.priority,
      assigneeId: data.assigneeId || null,
      creatorId: context.userId,
      startDate: data.startDate || null,
      dueDate: data.dueDate || null,
      estimate: data.estimate ?? null,
      completedAt,
      createdAt: now,
      updatedAt: now,
    });

    if (data.assigneeId) {
      await tx.insert(issueAssignee).values({
        id: randomUUID(),
        issueId,
        userId: data.assigneeId,
        assignedBy: context.userId,
        assignedAt: now,
      });
    }

    if (data.labelIds.length) {
      await tx.insert(issueLabelLink).values(
        data.labelIds.map((labelId) => ({
          id: randomUUID(),
          issueId,
          labelId,
          createdAt: now,
        })),
      );
    }

    await tx.insert(activityEvent).values({
      id: randomUUID(),
      workspaceId: context.workspaceId,
      issueId,
      actorId: context.userId,
      type: "issue_created",
      payload: {
        title: data.title,
      },
      createdAt: now,
    });
  });

  if (data.assigneeId && data.assigneeId !== context.userId) {
    await createNotification({
      workspaceId: context.workspaceId,
      userId: data.assigneeId,
      type: "issue_assigned",
      title: `Assigned to ${identifier}`,
      body: data.title,
      entityType: "issue",
      entityId: issueId,
    });
  }

  await publishWorkspaceEvent({
    workspaceId: context.workspaceId,
    type: "issue_created",
    payload: {
      issueId,
      identifier,
      title: data.title,
    },
  });

  return NextResponse.json({ issue: { id: issueId, identifier } });
}
