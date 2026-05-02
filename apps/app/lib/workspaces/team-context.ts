import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/lib/db/db";
import { team } from "@/lib/db/schema";
import { requireWorkspaceContext } from "@/lib/workspaces/access";

export type TeamContext = {
  userId: string;
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  role: "owner" | "admin" | "member";
  teamId: string;
  teamKey: string;
  teamName: string;
};

export async function requireTeamContextFromKey(
  slug: string,
  teamKey: string,
): Promise<TeamContext> {
  const workspaceContext = await requireWorkspaceContext(slug);
  const normalizedTeamKey = teamKey.toUpperCase();

  const [teamRow] = await db
    .select({
      id: team.id,
      key: team.key,
      name: team.name,
    })
    .from(team)
    .where(
      and(
        eq(team.workspaceId, workspaceContext.workspaceId),
        eq(team.key, normalizedTeamKey),
      ),
    )
    .limit(1);

  if (!teamRow) {
    notFound();
  }

  return {
    ...workspaceContext,
    teamId: teamRow.id,
    teamKey: teamRow.key,
    teamName: teamRow.name,
  };
}
