import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { type NormalizedDataTableSearchParams } from "@/components/data-table/search-params";
import { type IssueTableRow } from "@/components/linear/issue-data-table/types";
import { db } from "@/lib/db/db";
import {
  issue,
  issueLabel,
  issueLabelLink,
  issueStatus,
  milestone,
  project,
  team,
  user,
} from "@/lib/db/schema";

const SORT_COLUMNS = {
  identifier: issue.identifier,
  title: issue.title,
  priority: issue.priority,
  createdAt: issue.createdAt,
  updatedAt: issue.updatedAt,
} as const;

function getWhereClause(params: {
  workspaceId: string;
  projectId: string;
  searchParams: NormalizedDataTableSearchParams;
}): SQL {
  const { workspaceId, projectId, searchParams } = params;
  const conditions: SQL[] = [eq(issue.workspaceId, workspaceId), eq(issue.projectId, projectId)];
  const keyword = searchParams.q.trim();
  if (keyword) {
    const pattern = `%${keyword}%`;
    conditions.push(or(ilike(issue.identifier, pattern), ilike(issue.title, pattern))!);
  }

  const statusFilters = searchParams.filters.statusId ?? [];
  if (statusFilters.length) {
    conditions.push(inArray(issue.statusId, statusFilters));
  }

  const priorityFilters = searchParams.filters.priority ?? [];
  if (priorityFilters.length) {
    conditions.push(inArray(issue.priority, priorityFilters as Array<typeof issue.$inferSelect.priority>));
  }

  const projectFilters = searchParams.filters.projectId ?? [];
  if (projectFilters.length) {
    conditions.push(inArray(issue.projectId, projectFilters));
  }

  const milestoneFilters = searchParams.filters.milestoneId ?? [];
  if (milestoneFilters.length) {
    conditions.push(inArray(issue.milestoneId, milestoneFilters));
  }

  return and(...conditions)!;
}

export async function getProjectIssuesForDataTable(
  workspaceId: string,
  projectId: string,
  searchParams: NormalizedDataTableSearchParams,
): Promise<{
  rows: IssueTableRow[];
  totalCount: number;
  statusFilterOptions: Array<{ label: string; value: string; count: number }>;
}> {
  const where = getWhereClause({ workspaceId, projectId, searchParams });
  const page = Math.max(1, searchParams.page);
  const pageSize = Math.max(1, searchParams.pageSize);
  const offset = (page - 1) * pageSize;
  const sortColumn = SORT_COLUMNS[searchParams.sort as keyof typeof SORT_COLUMNS] ?? issue.identifier;
  const sortDirection = searchParams.order === "desc" ? desc(sortColumn) : asc(sortColumn);

  const [rows, countRows, statuses, groupedByStatus] = await Promise.all([
    db
      .select({
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        description: issue.description,
        statusId: issue.statusId,
        statusName: issueStatus.name,
        priority: issue.priority,
        assigneeId: issue.assigneeId,
        assigneeName: user.name,
        projectId: issue.projectId,
        projectName: project.name,
        milestoneId: issue.milestoneId,
        milestoneName: milestone.name,
        teamId: issue.teamId,
        teamName: team.name,
        dueDate: issue.dueDate,
        estimate: issue.estimate,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
      })
      .from(issue)
      .innerJoin(issueStatus, eq(issueStatus.id, issue.statusId))
      .leftJoin(user, eq(user.id, issue.assigneeId))
      .leftJoin(project, eq(project.id, issue.projectId))
      .leftJoin(milestone, eq(milestone.id, issue.milestoneId))
      .leftJoin(team, eq(team.id, issue.teamId))
      .where(where)
      .orderBy(sortDirection, asc(issue.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({
        totalCount: sql<number>`count(*)`,
      })
      .from(issue)
      .where(where),
    db
      .select({ id: issueStatus.id, name: issueStatus.name })
      .from(issueStatus)
      .where(eq(issueStatus.workspaceId, workspaceId))
      .orderBy(asc(issueStatus.position)),
    db
      .select({
        statusId: issue.statusId,
        count: sql<number>`count(*)`,
      })
      .from(issue)
      .where(where)
      .groupBy(issue.statusId),
  ]);

  const issueIds = rows.map((row) => row.id);
  const labelRows = issueIds.length
    ? await db
      .select({
        issueId: issueLabelLink.issueId,
        labelName: issueLabel.name,
      })
      .from(issueLabelLink)
      .innerJoin(issueLabel, eq(issueLabel.id, issueLabelLink.labelId))
      .where(inArray(issueLabelLink.issueId, issueIds))
    : [];

  const labelsByIssue = new Map<string, string[]>();
  for (const row of labelRows) {
    const existing = labelsByIssue.get(row.issueId) ?? [];
    existing.push(row.labelName);
    labelsByIssue.set(row.issueId, existing);
  }

  const countByStatus = new Map<string, number>();
  for (const row of groupedByStatus) {
    countByStatus.set(row.statusId, Number(row.count ?? 0));
  }

  const statusFilterOptions = statuses.map((status) => ({
    label: status.name,
    value: status.id,
    count: countByStatus.get(status.id) ?? 0,
  }));

  return {
    rows: rows.map((item) => ({
      id: item.id,
      identifier: item.identifier,
      title: item.title,
      description: item.description,
      statusId: item.statusId,
      statusName: item.statusName,
      priority: item.priority,
      assigneeId: item.assigneeId,
      assigneeName: item.assigneeName ?? null,
      projectId: item.projectId,
      projectName: item.projectName ?? null,
      milestoneId: item.milestoneId,
      milestoneName: item.milestoneName ?? null,
      teamId: item.teamId,
      teamName: item.teamName ?? null,
      dueDate: item.dueDate,
      estimate: item.estimate,
      labels: labelsByIssue.get(item.id) ?? [],
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
    totalCount: Number(countRows[0]?.totalCount ?? 0),
    statusFilterOptions,
  };
}
