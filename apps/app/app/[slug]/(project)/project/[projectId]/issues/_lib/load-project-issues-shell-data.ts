import { eq } from "drizzle-orm";

import { type NormalizedDataTableSearchParams } from "@/components/data-table/search-params";
import { db } from "@/lib/db/db";
import { issueLabel, issueStatus, team, user, workspaceMember } from "@/lib/db/schema";

import { getProjectIssuesForDataTable } from "./query-project-issues";

export async function loadProjectIssuesShellData(params: {
  workspaceId: string;
  projectId: string;
  normalizedSearchParams: NormalizedDataTableSearchParams;
}) {
  const { workspaceId, projectId, normalizedSearchParams } = params;

  const [tableData, statuses, members, teams, labels] = await Promise.all([
    getProjectIssuesForDataTable(workspaceId, projectId, normalizedSearchParams),
    db
      .select({ id: issueStatus.id, name: issueStatus.name })
      .from(issueStatus)
      .where(eq(issueStatus.workspaceId, workspaceId)),
    db
      .select({ id: user.id, name: user.name })
      .from(workspaceMember)
      .innerJoin(user, eq(user.id, workspaceMember.userId))
      .where(eq(workspaceMember.workspaceId, workspaceId)),
    db
      .select({ id: team.id, key: team.key, name: team.name })
      .from(team)
      .where(eq(team.workspaceId, workspaceId)),
    db
      .select({ id: issueLabel.id, name: issueLabel.name, color: issueLabel.color })
      .from(issueLabel)
      .where(eq(issueLabel.workspaceId, workspaceId)),
  ]);

  return { tableData, statuses, members, teams, labels };
}
