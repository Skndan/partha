import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";

import { db } from "@/lib/db/db";
import { activityEvent, issue, issueRelation } from "@/lib/db/schema";
import { CreateIssueRelationSchema } from "@/lib/validators/linear";
import { getWorkspaceApiContext } from "@/lib/workspaces/api-access";
import { publishWorkspaceEvent } from "@/lib/workspaces/realtime";
import { alias } from "drizzle-orm/pg-core";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; issueId: string }> },
) {
  const { slug, issueId } = await params;
  const context = await getWorkspaceApiContext(slug);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = CreateIssueRelationSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const [sourceIssue] = await db
    .select({ id: issue.id })
    .from(issue)
    .where(and(eq(issue.id, issueId), eq(issue.workspaceId, context.workspaceId)))
    .limit(1);
  if (!sourceIssue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  const [targetIssue] = await db
    .select({ id: issue.id, identifier: issue.identifier, title: issue.title })
    .from(issue)
    .where(
      and(
        eq(issue.id, parsed.data.targetIssueId),
        eq(issue.workspaceId, context.workspaceId),
      ),
    )
    .limit(1);
  if (!targetIssue) {
    return NextResponse.json({ error: "Target issue not found" }, { status: 404 });
  }
  if (parsed.data.targetIssueId === issueId) {
    return NextResponse.json({ error: "Issue cannot be related to itself" }, { status: 400 });
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.insert(issueRelation).values({
      id: randomUUID(),
      workspaceId: context.workspaceId,
      sourceIssueId: issueId,
      targetIssueId: parsed.data.targetIssueId,
      type: parsed.data.type,
      createdBy: context.userId,
      createdAt: now,
    });

    await tx.insert(activityEvent).values({
      id: randomUUID(),
      workspaceId: context.workspaceId,
      issueId,
      actorId: context.userId,
      type: "relation_added",
      payload: {
        targetIssueId: parsed.data.targetIssueId,
        targetIssueIdentifier: targetIssue.identifier,
        targetIssueTitle: targetIssue.title,
        type: parsed.data.type,
        relationType: parsed.data.type,
      },
      createdAt: now,
    });
  });

  await publishWorkspaceEvent({
    workspaceId: context.workspaceId,
    type: "issue_relation_added",
    payload: {
      issueId,
      targetIssueId: parsed.data.targetIssueId,
      relationType: parsed.data.type,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; issueId: string }> },
) {
  const { slug, issueId } = await params;
  const context = await getWorkspaceApiContext(slug);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sourceIssue = alias(issue, "source_issue");
  const targetIssue = alias(issue, "target_issue");
  const relations = await db
    .select({
      id: issueRelation.id,
      sourceIssueId: issueRelation.sourceIssueId,
      sourceIssueIdentifier: sourceIssue.identifier,
      sourceIssueTitle: sourceIssue.title,
      targetIssueId: issueRelation.targetIssueId,
      targetIssueIdentifier: targetIssue.identifier,
      targetIssueTitle: targetIssue.title,
      type: issueRelation.type,
    })
    .from(issueRelation)
    .innerJoin(sourceIssue, eq(sourceIssue.id, issueRelation.sourceIssueId))
    .innerJoin(targetIssue, eq(targetIssue.id, issueRelation.targetIssueId))
    .where(
      and(
        eq(issueRelation.workspaceId, context.workspaceId),
        or(eq(issueRelation.sourceIssueId, issueId), eq(issueRelation.targetIssueId, issueId)),
      ),
    );

  return NextResponse.json({
    relations: relations.map((relation) => ({
      id: relation.id,
      type: relation.type,
      direction: relation.sourceIssueId === issueId ? "outgoing" : "incoming",
      issueId: relation.sourceIssueId === issueId ? relation.targetIssueId : relation.sourceIssueId,
      issueIdentifier:
        relation.sourceIssueId === issueId
          ? relation.targetIssueIdentifier
          : relation.sourceIssueIdentifier,
      issueTitle:
        relation.sourceIssueId === issueId ? relation.targetIssueTitle : relation.sourceIssueTitle,
    })),
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string; issueId: string }> },
) {
  const { slug, issueId } = await params;
  const context = await getWorkspaceApiContext(slug);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const relationId = new URL(request.url).searchParams.get("relationId");
  if (!relationId) {
    return NextResponse.json({ error: "relationId is required" }, { status: 400 });
  }

  const [relation] = await db
    .select({
      id: issueRelation.id,
      sourceIssueId: issueRelation.sourceIssueId,
      targetIssueId: issueRelation.targetIssueId,
      type: issueRelation.type,
    })
    .from(issueRelation)
    .where(
      and(
        eq(issueRelation.id, relationId),
        eq(issueRelation.workspaceId, context.workspaceId),
        or(eq(issueRelation.sourceIssueId, issueId), eq(issueRelation.targetIssueId, issueId)),
      ),
    )
    .limit(1);

  if (!relation) {
    return NextResponse.json({ error: "Relation not found" }, { status: 404 });
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.delete(issueRelation).where(eq(issueRelation.id, relationId));
    await tx.insert(activityEvent).values({
      id: randomUUID(),
      workspaceId: context.workspaceId,
      issueId,
      actorId: context.userId,
      type: "relation_removed",
      payload: {
        relationId,
        relationType: relation.type,
        targetIssueId:
          relation.sourceIssueId === issueId ? relation.targetIssueId : relation.sourceIssueId,
      },
      createdAt: now,
    });
  });

  await publishWorkspaceEvent({
    workspaceId: context.workspaceId,
    type: "issue_relation_removed",
    payload: {
      issueId,
      relationId,
    },
  });

  return NextResponse.json({ ok: true });
}
