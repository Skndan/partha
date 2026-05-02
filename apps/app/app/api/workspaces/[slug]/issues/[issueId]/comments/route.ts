import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/lib/db/db";
import { activityEvent, issue, issueComment, user } from "@/lib/db/schema";
import { CreateIssueCommentSchema } from "@/lib/validators/linear";
import { getWorkspaceApiContext } from "@/lib/workspaces/api-access";
import { createNotification } from "@/lib/workspaces/notifications";
import { publishWorkspaceEvent } from "@/lib/workspaces/realtime";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; issueId: string }> },
) {
  const { slug, issueId } = await params;
  const context = await getWorkspaceApiContext(slug);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const comments = await db
    .select({
      id: issueComment.id,
      body: issueComment.body,
      createdAt: issueComment.createdAt,
      authorId: issueComment.authorId,
      authorName: user.name,
      authorImage: user.image,
    })
    .from(issueComment)
    .innerJoin(user, eq(user.id, issueComment.authorId))
    .where(
      and(
        eq(issueComment.workspaceId, context.workspaceId),
        eq(issueComment.issueId, issueId),
      ),
    )
    .orderBy(asc(issueComment.createdAt));

  return NextResponse.json({ comments });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; issueId: string }> },
) {
  const { slug, issueId } = await params;
  const context = await getWorkspaceApiContext(slug);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [existingIssue] = await db
    .select({ id: issue.id, assigneeId: issue.assigneeId, title: issue.title })
    .from(issue)
    .where(and(eq(issue.id, issueId), eq(issue.workspaceId, context.workspaceId)))
    .limit(1);

  if (!existingIssue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = CreateIssueCommentSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.insert(issueComment).values({
      id: randomUUID(),
      workspaceId: context.workspaceId,
      issueId,
      authorId: context.userId,
      body: parsed.data.body,
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(activityEvent).values({
      id: randomUUID(),
      workspaceId: context.workspaceId,
      issueId,
      actorId: context.userId,
      type: "comment_added",
      payload: { body: parsed.data.body },
      createdAt: now,
    });
  });

  if (
    existingIssue.assigneeId &&
    existingIssue.assigneeId !== context.userId
  ) {
    await createNotification({
      workspaceId: context.workspaceId,
      userId: existingIssue.assigneeId,
      type: "issue_comment",
      title: `New comment on ${existingIssue.title}`,
      body: parsed.data.body.slice(0, 140),
      entityType: "issue",
      entityId: issueId,
    });
  }

  await publishWorkspaceEvent({
    workspaceId: context.workspaceId,
    type: "issue_comment_added",
    payload: {
      issueId,
      body: parsed.data.body,
    },
  });

  return NextResponse.json({ ok: true });
}
