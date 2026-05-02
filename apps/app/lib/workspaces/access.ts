import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import { workspace, workspaceMember } from "@/lib/db/schema";

export type WorkspaceContext = {
  userId: string;
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  role: "owner" | "admin" | "member";
};

export async function getWorkspaceContextFromSlug(
  slug: string,
): Promise<WorkspaceContext | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  const [membership] = await db
    .select({
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      workspaceSlug: workspace.slug,
      role: workspaceMember.role,
    })
    .from(workspaceMember)
    .innerJoin(workspace, eq(workspace.id, workspaceMember.workspaceId))
    .where(
      and(eq(workspaceMember.userId, session.user.id), eq(workspace.slug, slug)),
    )
    .limit(1);

  if (!membership) {
    return null;
  }

  return {
    userId: session.user.id,
    workspaceId: membership.workspaceId,
    workspaceName: membership.workspaceName,
    workspaceSlug: membership.workspaceSlug,
    role: membership.role,
  };
}

export async function requireWorkspaceContext(
  slug: string,
): Promise<WorkspaceContext> {
  const context = await getWorkspaceContextFromSlug(slug);

  if (!context) {
    redirect("/onboarding");
  }

  return context;
}
