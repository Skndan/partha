import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/db";
import {
  activityEvent,
  issue,
  issueLabelLink,
  issueRelation,
} from "@/lib/db/schema";
import {
  getStatusRecord,
  resolveCompletedAtForUpdate,
  validateAssignee,
  validateLabelIds,
  validateMilestoneForProject,
  validateParentIssue,
  validateTeam,
  getProjectRecord,
} from "@/lib/linear/issue-mutations";
import { UpdateIssueSchema } from "@/lib/validators/linear";
import { getWorkspaceApiContext } from "@/lib/workspaces/api-access";
import { createNotification } from "@/lib/workspaces/notifications";
import { publishWorkspaceEvent } from "@/lib/workspaces/realtime";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; issueId: string }> },
) {
  const { slug, issueId } = await params;
  const context = await getWorkspaceApiContext(slug);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = UpdateIssueSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const [existingIssue] = await db
    .select({ id: issue.id, projectId: issue.projectId, milestoneId: issue.milestoneId })
    .from(issue)
    .where(and(eq(issue.id, issueId), eq(issue.workspaceId, context.workspaceId)))
    .limit(1);

  if (!existingIssue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  const data = parsed.data;
  const [existingIssueDetails] = await db
    .select({
      title: issue.title,
      description: issue.description,
      statusId: issue.statusId,
      priority: issue.priority,
      teamId: issue.teamId,
      projectId: issue.projectId,
      milestoneId: issue.milestoneId,
      assigneeId: issue.assigneeId,
      dueDate: issue.dueDate,
      estimate: issue.estimate,
      parentIssueId: issue.parentIssueId,
      completedAt: issue.completedAt,
    })
    .from(issue)
    .where(and(eq(issue.id, issueId), eq(issue.workspaceId, context.workspaceId)))
    .limit(1);
  if (!existingIssueDetails) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  const currentStatus = await getStatusRecord(context.workspaceId, existingIssueDetails.statusId);
  if (!currentStatus) {
    return NextResponse.json({ error: "Invalid current status" }, { status: 400 });
  }

  let nextStatus = currentStatus;
  if (data.statusId) {
    const status = await getStatusRecord(context.workspaceId, data.statusId);
    if (!status) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    nextStatus = status;
  }

  if (data.teamId && !(await validateTeam(context.workspaceId, data.teamId))) {
    return NextResponse.json({ error: "Invalid team" }, { status: 400 });
  }

  if (data.projectId) {
    const row = await getProjectRecord(context.workspaceId, data.projectId);
    if (!row) return NextResponse.json({ error: "Invalid project" }, { status: 400 });
  }

  const effectiveProjectId =
    data.projectId !== undefined ? (data.projectId ?? null) : (existingIssue.projectId ?? null);
  const effectiveMilestoneId =
    data.milestoneId !== undefined
      ? (data.milestoneId ?? null)
      : (existingIssue.milestoneId ?? null);

  if (effectiveMilestoneId) {
    if (!effectiveProjectId) {
      return NextResponse.json(
        { error: "Milestone can only be assigned to a project issue" },
        { status: 400 },
      );
    }

    const validMilestone = await validateMilestoneForProject(
      context.workspaceId,
      effectiveMilestoneId,
      effectiveProjectId,
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

  if (data.labelIds && !(await validateLabelIds(context.workspaceId, data.labelIds))) {
    return NextResponse.json({ error: "Invalid label selected" }, { status: 400 });
  }

  if (data.parentIssueId) {
    const parentValidation = await validateParentIssue({
      workspaceId: context.workspaceId,
      issueId,
      parentIssueId: data.parentIssueId,
    });
    if (!parentValidation.ok) {
      return NextResponse.json({ error: parentValidation.error }, { status: 400 });
    }
  }

  if (data.relationTargetIssueId) {
    if (data.relationTargetIssueId === issueId) {
      return NextResponse.json({ error: "Issue cannot be related to itself" }, { status: 400 });
    }
    const [targetIssue] = await db
      .select({ id: issue.id })
      .from(issue)
      .where(
        and(
          eq(issue.id, data.relationTargetIssueId),
          eq(issue.workspaceId, context.workspaceId),
        ),
      )
      .limit(1);
    if (!targetIssue) {
      return NextResponse.json({ error: "Target issue not found" }, { status: 404 });
    }
  }

  const updateInput: Partial<typeof issue.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (data.title !== undefined) updateInput.title = data.title;
  if (data.description !== undefined) updateInput.description = data.description;
  if (data.acceptanceCriteria !== undefined) updateInput.acceptanceCriteria = data.acceptanceCriteria;
  if (data.statusId !== undefined) updateInput.statusId = data.statusId;
  if (data.priority !== undefined) updateInput.priority = data.priority;
  if (data.teamId !== undefined) updateInput.teamId = data.teamId || null;
  if (data.projectId !== undefined) updateInput.projectId = data.projectId || null;
  if (data.milestoneId !== undefined) updateInput.milestoneId = data.milestoneId || null;
  if (data.assigneeId !== undefined) updateInput.assigneeId = data.assigneeId || null;
  if (data.dueDate !== undefined) updateInput.dueDate = data.dueDate || null;
  if (data.parentIssueId !== undefined) updateInput.parentIssueId = data.parentIssueId || null;
  if (data.estimate !== undefined) updateInput.estimate = data.estimate ?? null;
  if (data.statusId !== undefined) {
    updateInput.completedAt = resolveCompletedAtForUpdate({
      currentStatusType: currentStatus.type,
      nextStatusType: nextStatus.type,
      currentCompletedAt: existingIssueDetails.completedAt,
      now: updateInput.updatedAt,
    });
  }

  const changeEntries: Array<{ field: string; from: string | null; to: string | null }> = [];
  const addChange = (field: string, from: unknown, to: unknown) => {
    if (String(from ?? "") !== String(to ?? "")) {
      changeEntries.push({
        field,
        from: from == null ? null : String(from),
        to: to == null ? null : String(to),
      });
    }
  };
  addChange("Title", existingIssueDetails.title, data.title ?? existingIssueDetails.title);
  addChange("Description", existingIssueDetails.description, data.description ?? existingIssueDetails.description);
  addChange("Status", currentStatus.name, nextStatus.name);
  addChange("Priority", existingIssueDetails.priority, data.priority ?? existingIssueDetails.priority);
  addChange("Assignee", existingIssueDetails.assigneeId, data.assigneeId ?? existingIssueDetails.assigneeId);
  addChange("Estimate", existingIssueDetails.estimate, data.estimate ?? existingIssueDetails.estimate);
  addChange("Due date", existingIssueDetails.dueDate, data.dueDate ?? existingIssueDetails.dueDate);

  await db.transaction(async (tx) => {
    await tx.update(issue).set(updateInput).where(eq(issue.id, issueId));

    if (data.labelIds) {
      await tx.delete(issueLabelLink).where(eq(issueLabelLink.issueId, issueId));
      if (data.labelIds.length) {
        await tx.insert(issueLabelLink).values(
          data.labelIds.map((labelId) => ({
            id: randomUUID(),
            issueId,
            labelId,
            createdAt: new Date(),
          })),
        );
      }
    }

    if (data.relationTargetIssueId && data.relationType) {
      await tx.insert(issueRelation).values({
        id: randomUUID(),
        workspaceId: context.workspaceId,
        sourceIssueId: issueId,
        targetIssueId: data.relationTargetIssueId,
        type: data.relationType,
        createdBy: context.userId,
        createdAt: new Date(),
      });
    }

    await tx.insert(activityEvent).values({
      id: randomUUID(),
      workspaceId: context.workspaceId,
      issueId,
      actorId: context.userId,
      type: "issue_updated",
      payload: {
        changes: changeEntries,
      },
      createdAt: new Date(),
    });
  });

  if (data.assigneeId && data.assigneeId !== context.userId) {
    await createNotification({
      workspaceId: context.workspaceId,
      userId: data.assigneeId,
      type: "issue_assigned",
      title: `Assigned to issue`,
      body: data.title ?? "Issue updated",
      entityType: "issue",
      entityId: issueId,
    });
  }

  await publishWorkspaceEvent({
    workspaceId: context.workspaceId,
    type: "issue_updated",
    payload: {
      issueId,
      fields: Object.keys(data),
    },
  });

  return NextResponse.json({ ok: true });
}
