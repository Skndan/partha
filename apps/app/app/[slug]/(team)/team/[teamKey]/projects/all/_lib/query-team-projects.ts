import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  sql,
  or,
  type SQL,
} from "drizzle-orm";

import { type NormalizedDataTableSearchParams } from "@/components/data-table/search-params";
import { type ProjectTableRow } from "@/components/linear/project-data-table/types";
import { db } from "@/lib/db/db";
import { project, team } from "@/lib/db/schema";

const SORT_COLUMNS = {
  name: project.name,
  key: project.key,
  status: project.status,
  targetDate: project.targetDate,
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
} as const;

function getWhereClause(params: {
  workspaceId: string;
  teamId: string;
  searchParams: NormalizedDataTableSearchParams;
}): SQL {
  const { workspaceId, teamId, searchParams } = params;
  const conditions: SQL[] = [eq(project.workspaceId, workspaceId), eq(project.teamId, teamId)];
  const keyword = searchParams.q.trim();
  if (keyword) {
    const pattern = `%${keyword}%`;
    conditions.push(
      or(ilike(project.id, pattern), ilike(project.name, pattern), ilike(project.key, pattern))!,
    );
  }

  const statusFilters = searchParams.filters.status ?? [];
  if (statusFilters.length) {
    conditions.push(inArray(project.status, statusFilters as Array<typeof project.$inferSelect.status>));
  }

  return and(...conditions)!;
}

export async function getTeamProjectsForDataTable(
  workspaceId: string,
  teamId: string,
  searchParams: NormalizedDataTableSearchParams,
): Promise<{
  rows: ProjectTableRow[];
  totalCount: number;
}> {
  const where = getWhereClause({ workspaceId, teamId, searchParams });
  const page = Math.max(1, searchParams.page);
  const pageSize = Math.max(1, searchParams.pageSize);
  const offset = (page - 1) * pageSize;

  const sortColumn = SORT_COLUMNS[searchParams.sort as keyof typeof SORT_COLUMNS] ?? project.name;
  const sortDirection = searchParams.order === "desc" ? desc(sortColumn) : asc(sortColumn);

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: project.id,
        name: project.name,
        key: project.key,
        description: project.description,
        status: project.status,
        teamId: project.teamId,
        teamName: team.name,
        targetDate: project.targetDate,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      })
      .from(project)
      .leftJoin(team, eq(team.id, project.teamId))
      .where(where)
      .orderBy(sortDirection, asc(project.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({
        totalCount: sql<number>`count(*)`,
      })
      .from(project)
      .where(where),
  ]);

  return {
    rows: rows.map((item) => ({
      id: item.id,
      name: item.name,
      key: item.key,
      description: item.description,
      status: item.status,
      teamId: item.teamId,
      teamName: item.teamName ?? null,
      targetDate: item.targetDate,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
    totalCount: Number(countRows[0]?.totalCount ?? 0),
  };
}
