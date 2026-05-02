import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { type NormalizedDataTableSearchParams } from "@/components/data-table/search-params";
import { db } from "@/lib/db/db";
import { project, team } from "@/lib/db/schema";
import { type ProjectTableRow } from "@/components/linear/project-data-table/types";

const SORT_COLUMNS = {
  name: project.name,
  key: project.key,
  status: project.status,
  targetDate: project.targetDate,
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
} as const;

function getScopedWhereClause(params: {
  workspaceId: string;
  searchParams: NormalizedDataTableSearchParams;
}): SQL {
  const { workspaceId, searchParams } = params;
  const conditions: SQL[] = [eq(project.workspaceId, workspaceId)];
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

  const teamFilters = searchParams.filters.teamId ?? [];
  if (teamFilters.length) {
    const includeNone = teamFilters.includes("none");
    const selectedTeamIds = teamFilters.filter((value) => value !== "none");
    if (includeNone && selectedTeamIds.length) {
      conditions.push(or(inArray(project.teamId, selectedTeamIds), isNull(project.teamId))!);
    } else if (includeNone) {
      conditions.push(isNull(project.teamId));
    } else if (selectedTeamIds.length) {
      conditions.push(inArray(project.teamId, selectedTeamIds));
    }
  }

  return and(...conditions)!;
}

export async function getProjectsForDataTable(
  workspaceId: string,
  searchParams: NormalizedDataTableSearchParams,
): Promise<{
  rows: ProjectTableRow[];
  totalCount: number;
  teamFilterOptions: Array<{ label: string; value: string; count: number }>;
}> {
  const where = getScopedWhereClause({ workspaceId, searchParams });
  const page = Math.max(1, searchParams.page);
  const pageSize = Math.max(1, searchParams.pageSize);
  const offset = (page - 1) * pageSize;

  const sortColumn = SORT_COLUMNS[searchParams.sort as keyof typeof SORT_COLUMNS] ?? project.name;
  const sortDirection = searchParams.order === "desc" ? desc(sortColumn) : asc(sortColumn);

  const [rows, countRows, teams, groupedByTeam] = await Promise.all([
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
    db
      .select({ id: team.id, name: team.name })
      .from(team)
      .where(eq(team.workspaceId, workspaceId))
      .orderBy(asc(team.name)),
    db
      .select({
        teamId: project.teamId,
        count: sql<number>`count(*)`,
      })
      .from(project)
      .where(where)
      .groupBy(project.teamId),
  ]);

  const countByTeam = new Map<string, number>();
  let noneCount = 0;
  for (const row of groupedByTeam) {
    const count = Number(row.count ?? 0);
    if (row.teamId) {
      countByTeam.set(row.teamId, count);
    } else {
      noneCount = count;
    }
  }

  const teamFilterOptions = [
    { label: "No team", value: "none", count: noneCount },
    ...teams.map((item) => ({
      label: item.name,
      value: item.id,
      count: countByTeam.get(item.id) ?? 0,
    })),
  ];

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
    teamFilterOptions,
  };
}
