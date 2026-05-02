import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/db";
import { issueLabel } from "@/lib/db/schema";
import { CreateIssueLabelSchema } from "@/lib/validators/linear";
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

  const labels = await db
    .select()
    .from(issueLabel)
    .where(eq(issueLabel.workspaceId, context.workspaceId));

  return NextResponse.json({ labels });
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
  const parsed = CreateIssueLabelSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const existing = await db
    .select({ id: issueLabel.id })
    .from(issueLabel)
    .where(
      and(
        eq(issueLabel.workspaceId, context.workspaceId),
        eq(issueLabel.name, parsed.data.name),
      ),
    )
    .limit(1);

  if (existing.length) {
    return NextResponse.json(
      { error: { name: ["Label already exists"] } },
      { status: 409 },
    );
  }

  const id = randomUUID();
  await db.insert(issueLabel).values({
    id,
    workspaceId: context.workspaceId,
    name: parsed.data.name,
    color: parsed.data.color,
    createdBy: context.userId,
    createdAt: new Date(),
  });

  return NextResponse.json({ label: { id, name: parsed.data.name } });
}
