import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/db";
import { team } from "@/lib/db/schema";
import { CreateTeamSchema } from "@/lib/validators/linear";
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

  const teams = await db
    .select()
    .from(team)
    .where(eq(team.workspaceId, context.workspaceId));

  return NextResponse.json({ teams });
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

  if (context.role === "member") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = CreateTeamSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, key, description } = parsed.data;
  const now = new Date();

  const [existing] = await db
    .select({ id: team.id })
    .from(team)
    .where(
      and(
        eq(team.workspaceId, context.workspaceId),
        eq(team.key, key.toUpperCase()),
      ),
    )
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: { key: ["Team key already exists"] } },
      { status: 409 },
    );
  }

  const id = randomUUID();
  await db.insert(team).values({
    id,
    workspaceId: context.workspaceId,
    name,
    key: key.toUpperCase(),
    description: description || null,
    createdBy: context.userId,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ team: { id, name, key: key.toUpperCase() } });
}
