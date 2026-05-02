import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { and, count, eq } from "drizzle-orm";

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import {
  issueStatus,
  workspace,
  workspaceMember,
} from "@/lib/db/schema";
import { CreateWorkspaceSchema } from "@/lib/validators/workspace";

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = CreateWorkspaceSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const now = new Date();
  const { name, slug } = parsed.data;

  const [slugConflict] = await db
    .select({ id: workspace.id })
    .from(workspace)
    .where(eq(workspace.slug, slug))
    .limit(1);

  if (slugConflict) {
    return NextResponse.json(
      { error: { slug: ["Slug is already in use"] } },
      { status: 409 },
    );
  }

  const [ownerMembershipCount] = await db
    .select({
      value: count(),
    })
    .from(workspaceMember)
    .where(
      and(
        eq(workspaceMember.userId, session.user.id),
        eq(workspaceMember.role, "owner"),
      ),
    );

  if ((ownerMembershipCount?.value ?? 0) >= 10) {
    return NextResponse.json(
      { error: "Workspace limit reached for this account." },
      { status: 400 },
    );
  }

  const workspaceId = randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(workspace).values({
      id: workspaceId,
      name,
      slug,
      createdBy: session.user.id,
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(workspaceMember).values({
      id: randomUUID(),
      workspaceId,
      userId: session.user.id,
      role: "owner",
      joinedAt: now,
    });

    await tx.insert(issueStatus).values([
      {
        id: randomUUID(),
        workspaceId,
        name: "Backlog",
        type: "backlog",
        position: 0,
        color: "var(--muted-foreground)",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: randomUUID(),
        workspaceId,
        name: "Todo",
        type: "unstarted",
        position: 1,
        color: "var(--primary)",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: randomUUID(),
        workspaceId,
        name: "In Progress",
        type: "started",
        position: 2,
        color: "var(--chart-2)",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: randomUUID(),
        workspaceId,
        name: "Done",
        type: "completed",
        position: 3,
        color: "var(--chart-4)",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: randomUUID(),
        workspaceId,
        name: "Canceled",
        type: "canceled",
        position: 4,
        color: "var(--destructive)",
        createdAt: now,
        updatedAt: now,
      },
    ]);
  });

  return NextResponse.json({
    workspace: {
      id: workspaceId,
      slug,
      name,
    },
  });
}
