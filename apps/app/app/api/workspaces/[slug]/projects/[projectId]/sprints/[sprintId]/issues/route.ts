import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { and, eq, inArray, max } from "drizzle-orm";

import { db } from "@/lib/db/db";
import { issue, project, sprint, sprintIssue } from "@/lib/db/schema";
import { AddSprintIssuesSchema, ReorderSprintIssuesSchema } from "@/lib/validators/linear";
import { getWorkspaceApiContext } from "@/lib/workspaces/api-access";

async function loadSprintOr404(
  contextWorkspaceId: string,
  projectId: string,
  sprintId: string,
) {
  const [row] = await db
    .select({ id: sprint.id })
    .from(sprint)
    .where(
      and(
        eq(sprint.id, sprintId),
        eq(sprint.workspaceId, contextWorkspaceId),
        eq(sprint.projectId, projectId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; projectId: string; sprintId: string }> },
) {
  const { slug, projectId, sprintId } = await params;
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

  const sprintRow = await loadSprintOr404(context.workspaceId, projectId, sprintId);
  if (!sprintRow) {
    return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = AddSprintIssuesSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const issueIds = [...new Set(parsed.data.issueIds)];

  const existingLinks = await db
    .select({ issueId: sprintIssue.issueId })
    .from(sprintIssue)
    .where(inArray(sprintIssue.issueId, issueIds));

  if (existingLinks.length > 0) {
    return NextResponse.json(
      {
        error: `Some issues are already in a sprint: ${existingLinks.map((r) => r.issueId).join(", ")}`,
      },
      { status: 409 },
    );
  }

  const issueRows = await db
    .select({
      id: issue.id,
      projectId: issue.projectId,
    })
    .from(issue)
    .where(
      and(eq(issue.workspaceId, context.workspaceId), inArray(issue.id, issueIds)),
    );

  if (issueRows.length !== issueIds.length) {
    return NextResponse.json({ error: "One or more issues were not found" }, { status: 404 });
  }

  for (const row of issueRows) {
    if (row.projectId !== projectId) {
      return NextResponse.json(
        {
          error: {
            issueIds: ["Every issue must belong to this project before adding to the sprint"],
          },
        },
        { status: 400 },
      );
    }
  }

  const [{ maxPosition }] = await db
    .select({ maxPosition: max(sprintIssue.position) })
    .from(sprintIssue)
    .where(eq(sprintIssue.sprintId, sprintId));

  let position = (maxPosition ?? -1) + 1;
  const now = new Date();

  await db.transaction(async (tx) => {
    for (const issueId of issueIds) {
      await tx.insert(sprintIssue).values({
        id: randomUUID(),
        sprintId,
        issueId,
        position,
        createdAt: now,
      });
      position += 1;
    }
  });

  return NextResponse.json({ ok: true, added: issueIds.length });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; projectId: string; sprintId: string }> },
) {
  const { slug, projectId, sprintId } = await params;
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

  const sprintRow = await loadSprintOr404(context.workspaceId, projectId, sprintId);
  if (!sprintRow) {
    return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = ReorderSprintIssuesSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const ordered = parsed.data.orderedIssueIds;

  const links = await db
    .select({ issueId: sprintIssue.issueId })
    .from(sprintIssue)
    .where(eq(sprintIssue.sprintId, sprintId));

  const inSprint = new Set(links.map((l) => l.issueId));
  if (ordered.length !== inSprint.size) {
    return NextResponse.json(
      { error: "orderedIssueIds must include each sprint issue exactly once" },
      { status: 400 },
    );
  }

  const seen = new Set<string>();
  for (const id of ordered) {
    if (seen.has(id)) {
      return NextResponse.json({ error: "Duplicate issue id in orderedIssueIds" }, { status: 400 });
    }
    seen.add(id);
    if (!inSprint.has(id)) {
      return NextResponse.json(
        { error: "orderedIssueIds contains an issue not in this sprint" },
        { status: 400 },
      );
    }
  }

  await db.transaction(async (tx) => {
    let position = 0;
    for (const issueId of ordered) {
      await tx
        .update(sprintIssue)
        .set({ position })
        .where(and(eq(sprintIssue.sprintId, sprintId), eq(sprintIssue.issueId, issueId)));
      position += 1;
    }
  });

  return NextResponse.json({ ok: true });
}
