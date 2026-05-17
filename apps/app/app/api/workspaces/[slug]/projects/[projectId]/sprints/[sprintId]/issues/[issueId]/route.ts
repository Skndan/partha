import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/db";
import { project, sprint, sprintIssue } from "@/lib/db/schema";
import { getWorkspaceApiContext } from "@/lib/workspaces/api-access";

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ slug: string; projectId: string; sprintId: string; issueId: string }>;
  },
) {
  const { slug, projectId, sprintId, issueId } = await params;
  const context = await getWorkspaceApiContext(slug);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [proj] = await db
    .select({ id: project.id })
    .from(project)
    .where(and(eq(project.workspaceId, context.workspaceId), eq(project.id, projectId)))
    .limit(1);

  if (!proj) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const [sp] = await db
    .select({ id: sprint.id })
    .from(sprint)
    .where(
      and(
        eq(sprint.id, sprintId),
        eq(sprint.workspaceId, context.workspaceId),
        eq(sprint.projectId, projectId),
      ),
    )
    .limit(1);

  if (!sp) {
    return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
  }

  const removed = await db
    .delete(sprintIssue)
    .where(
      and(
        eq(sprintIssue.sprintId, sprintId),
        eq(sprintIssue.issueId, issueId),
      ),
    )
    .returning({ id: sprintIssue.id });

  if (!removed.length) {
    return NextResponse.json({ error: "Issue not in this sprint" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
