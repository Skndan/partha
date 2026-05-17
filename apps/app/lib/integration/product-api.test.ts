import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";
import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { db, closeDb } from "@/lib/db/db";
import {
  issue,
  user,
  workspaceInvite,
  workspaceMember,
} from "@/lib/db/schema";
import { describeIntegration } from "@/lib/mcp/integration/helpers";
import {
  cleanupIntegrationSeed,
  seedIntegrationData,
  type IntegrationSeed,
} from "@/lib/mcp/integration/fixtures";

let sessionUser: { id: string; email: string } | null = null;

mock.module("next/headers", () => ({
  headers: async () => new Headers(),
}));

mock.module("@/lib/auth/auth", () => ({
  auth: {
    api: {
      getSession: async () =>
        sessionUser
          ? {
              user: {
                id: sessionUser.id,
                email: sessionUser.email,
              },
            }
          : null,
    },
  },
}));

describeIntegration("product REST API integration", () => {
  let seed: IntegrationSeed;
  let invitee: { id: string; email: string };

  beforeAll(async () => {
    seed = await seedIntegrationData(`api-${randomUUID().slice(0, 8)}`);
    invitee = {
      id: randomUUID(),
      email: `invitee-${randomUUID().slice(0, 8)}@test.local`,
    };
    const now = new Date();
    await db.insert(user).values({
      id: invitee.id,
      name: "Invitee",
      email: invitee.email,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });
  });

  afterAll(async () => {
    sessionUser = null;
    await db.delete(user).where(eq(user.id, invitee.id));
    await cleanupIntegrationSeed(seed);
    await closeDb();
  });

  test("GET workspace issues returns seeded issue", async () => {
    sessionUser = { id: seed.userId, email: seed.email };
    const { GET } = await import("@/app/api/workspaces/[slug]/issues/route");
    const response = await GET(new Request("http://localhost/api"), {
      params: Promise.resolve({ slug: seed.workspaceSlug }),
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { issues: Array<{ id: string }> };
    expect(body.issues.some((row) => row.id === seed.issueId)).toBe(true);
  });

  test("POST workspace issues creates a new issue", async () => {
    sessionUser = { id: seed.userId, email: seed.email };
    const { POST } = await import("@/app/api/workspaces/[slug]/issues/route");
    const response = await POST(
      new Request("http://localhost/api", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "API integration issue",
          description: "Created in integration test",
          statusId: seed.statusId,
          priority: "low",
          projectId: seed.projectId,
          teamId: seed.teamId,
          labelIds: [],
        }),
      }),
      { params: Promise.resolve({ slug: seed.workspaceSlug }) },
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { issue: { id: string; title: string } };
    expect(body.issue.title).toBe("API integration issue");
    await db.delete(issue).where(eq(issue.id, body.issue.id));
  });

  test("POST workspace invite accept adds membership", async () => {
    const token = `invite-${randomUUID()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);

    await db.insert(workspaceInvite).values({
      id: randomUUID(),
      workspaceId: seed.workspaceId,
      email: invitee.email,
      role: "member",
      token,
      invitedBy: seed.userId,
      expiresAt,
      createdAt: now,
    });

    sessionUser = invitee;
    const { POST } = await import("@/app/api/workspace-invites/[token]/accept/route");
    const response = await POST(new Request("http://localhost/api"), {
      params: Promise.resolve({ token }),
    });
    expect(response.status).toBe(200);

    const [membership] = await db
      .select({ id: workspaceMember.id })
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.userId, invitee.id),
          eq(workspaceMember.workspaceId, seed.workspaceId),
        ),
      )
      .limit(1);
    expect(membership?.id).toBeTruthy();
  });

  test("POST workspaces creates workspace with default statuses", async () => {
    sessionUser = { id: seed.userId, email: seed.email };
    const slug = `api-ws-${randomUUID().slice(0, 8)}`;
    const { POST } = await import("@/app/api/workspaces/route");
    const response = await POST(
      new Request("http://localhost/api", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "API Workspace",
          slug,
        }),
      }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { workspace: { slug: string } };
    expect(body.workspace.slug).toBe(slug);
  });
});
