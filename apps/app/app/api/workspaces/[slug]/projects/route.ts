import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/db";
import { project, team } from "@/lib/db/schema";
import { CreateProjectSchema } from "@/lib/validators/linear";
import { getWorkspaceApiContext } from "@/lib/workspaces/api-access";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const context = await getWorkspaceApiContext(slug);

  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await db
    .select()
    .from(project)
    .where(eq(project.workspaceId, context.workspaceId));

  return NextResponse.json({ projects });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const context = await getWorkspaceApiContext(slug);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = CreateProjectSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, key, description, status, targetDate, teamId } = parsed.data;
  const normalizedKey = key.toUpperCase();

  const [existing] = await db
    .select({ id: project.id })
    .from(project)
    .where(
      and(eq(project.workspaceId, context.workspaceId), eq(project.key, normalizedKey)),
    )
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: { key: ["Project key already exists"] } },
      { status: 409 },
    );
  }

  if (teamId) {
    const [selectedTeam] = await db
      .select({ id: team.id })
      .from(team)
      .where(and(eq(team.workspaceId, context.workspaceId), eq(team.id, teamId)))
      .limit(1);

    if (!selectedTeam) {
      return NextResponse.json({ error: "Invalid team selected" }, { status: 400 });
    }
  }

  const now = new Date();
  const id = randomUUID();
  await db.insert(project).values({
    id,
    workspaceId: context.workspaceId,
    teamId: teamId || null,
    name,
    key: normalizedKey,
    description: description || null,
    status,
    targetDate: targetDate || null,
    createdBy: context.userId,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ project: { id, name, key: normalizedKey } });
}
