import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db/db";
import {
  issue,
  issueLabel,
  issueStatus,
  milestone,
  project,
  team,
  workspaceMember,
} from "@/lib/db/schema";

export type StatusRecord = {
  id: string;
  name: string;
  type: "backlog" | "unstarted" | "started" | "completed" | "canceled";
};

export async function getStatusRecord(
  workspaceId: string,
  statusId: string,
): Promise<StatusRecord | null> {
  const [row] = await db
    .select({ id: issueStatus.id, name: issueStatus.name, type: issueStatus.type })
    .from(issueStatus)
    .where(and(eq(issueStatus.workspaceId, workspaceId), eq(issueStatus.id, statusId)))
    .limit(1);
  return row ?? null;
}

export async function validateTeam(workspaceId: string, teamId: string) {
  const [row] = await db
    .select({ id: team.id })
    .from(team)
    .where(and(eq(team.workspaceId, workspaceId), eq(team.id, teamId)))
    .limit(1);
  return Boolean(row);
}

export async function getProjectRecord(workspaceId: string, projectId: string) {
  const [row] = await db
    .select({ id: project.id, key: project.key, name: project.name })
    .from(project)
    .where(and(eq(project.workspaceId, workspaceId), eq(project.id, projectId)))
    .limit(1);
  return row ?? null;
}

export async function validateMilestoneForProject(
  workspaceId: string,
  milestoneId: string,
  projectId: string,
) {
  const [row] = await db
    .select({ id: milestone.id })
    .from(milestone)
    .where(
      and(
        eq(milestone.workspaceId, workspaceId),
        eq(milestone.id, milestoneId),
        eq(milestone.projectId, projectId),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function validateAssignee(workspaceId: string, userId: string) {
  const [row] = await db
    .select({ id: workspaceMember.id })
    .from(workspaceMember)
    .where(and(eq(workspaceMember.workspaceId, workspaceId), eq(workspaceMember.userId, userId)))
    .limit(1);
  return Boolean(row);
}

export async function validateLabelIds(workspaceId: string, labelIds: string[]) {
  if (!labelIds.length) {
    return true;
  }

  const labels = await db
    .select({ id: issueLabel.id })
    .from(issueLabel)
    .where(and(eq(issueLabel.workspaceId, workspaceId), inArray(issueLabel.id, labelIds)));
  return labels.length === new Set(labelIds).size;
}

export async function validateParentIssue(params: {
  workspaceId: string;
  issueId?: string;
  parentIssueId: string;
}) {
  const { workspaceId, issueId, parentIssueId } = params;

  if (issueId && parentIssueId === issueId) {
    return { ok: false as const, error: "Issue cannot be parent of itself" };
  }

  const [parent] = await db
    .select({ id: issue.id, parentIssueId: issue.parentIssueId })
    .from(issue)
    .where(and(eq(issue.workspaceId, workspaceId), eq(issue.id, parentIssueId)))
    .limit(1);

  if (!parent) {
    return { ok: false as const, error: "Invalid parent issue" };
  }

  if (!issueId) {
    return { ok: true as const };
  }

  let cursor: string | null = parent.parentIssueId;
  const visited = new Set<string>([parentIssueId]);
  while (cursor) {
    if (cursor === issueId) {
      return { ok: false as const, error: "Parent issue would create a cycle" };
    }
    if (visited.has(cursor)) {
      break;
    }
    visited.add(cursor);
    const [next] = await db
      .select({ parentIssueId: issue.parentIssueId })
      .from(issue)
      .where(and(eq(issue.workspaceId, workspaceId), eq(issue.id, cursor)))
      .limit(1);
    cursor = next?.parentIssueId ?? null;
  }

  return { ok: true as const };
}

export function isCompletedStatusType(type: StatusRecord["type"]) {
  return type === "completed";
}

export function resolveCompletedAtForCreate(statusType: StatusRecord["type"], now: Date) {
  return isCompletedStatusType(statusType) ? now : null;
}

export function resolveCompletedAtForUpdate(params: {
  currentStatusType: StatusRecord["type"];
  nextStatusType: StatusRecord["type"];
  currentCompletedAt: Date | null;
  now: Date;
}) {
  const { currentStatusType, nextStatusType, currentCompletedAt, now } = params;
  const currentDone = isCompletedStatusType(currentStatusType);
  const nextDone = isCompletedStatusType(nextStatusType);
  if (!currentDone && nextDone) return now;
  if (currentDone && !nextDone) return null;
  if (currentDone && nextDone) return currentCompletedAt ?? now;
  return currentCompletedAt;
}
