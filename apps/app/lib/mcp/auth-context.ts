import { and, eq } from "drizzle-orm";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type { ServerNotification, ServerRequest } from "@modelcontextprotocol/sdk/types.js";
import { db } from "../db/db";
import { workspace, workspaceMember } from "../db/schema";

type McpAuthExtra = {
  userId: string;
  workspaceId: string | null;
};

export function getMcpAuthExtra(authInfo?: AuthInfo): McpAuthExtra | null {
  const extra = authInfo?.extra as McpAuthExtra | undefined;
  if (!extra?.userId) {
    return null;
  }
  return {
    userId: extra.userId,
    workspaceId: extra.workspaceId ?? null,
  };
}

export function requireMcpAuth(
  extra?: RequestHandlerExtra<ServerRequest, ServerNotification>,
) {
  const auth = getMcpAuthExtra(extra?.authInfo);
  if (!auth) {
    throw new Error("Unauthorized");
  }
  return auth;
}

export async function listAuthorizedWorkspaces(userId: string, workspaceId?: string | null) {
  const filters = workspaceId
    ? and(
      eq(workspaceMember.userId, userId),
      eq(workspaceMember.workspaceId, workspaceId),
    )
    : eq(workspaceMember.userId, userId);

  return db
    .select({
      id: workspace.id,
      slug: workspace.slug,
      name: workspace.name,
      role: workspaceMember.role,
    })
    .from(workspaceMember)
    .innerJoin(workspace, eq(workspace.id, workspaceMember.workspaceId))
    .where(filters);
}
