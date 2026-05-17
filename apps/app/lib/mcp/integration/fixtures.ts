import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/db";
import {
  issue,
  issueStatus,
  milestone,
  project,
  team,
  teamMember,
  user,
  workspace,
  workspaceMember,
} from "@/lib/db/schema";
import {
  createAuthorizationCode,
  exchangeAuthorizationCode,
} from "@/lib/mcp/oauth/service";
import { generateCodeVerifier, toCodeChallengeS256 } from "@/lib/mcp/oauth/pkce";

export type IntegrationSeed = {
  userId: string;
  email: string;
  workspaceId: string;
  workspaceSlug: string;
  teamId: string;
  teamKey: string;
  projectId: string;
  projectKey: string;
  milestoneId: string;
  statusId: string;
  issueId: string;
  issueIdentifier: string;
};

export async function seedIntegrationData(prefix = "mcp-int"): Promise<IntegrationSeed> {
  const userId = randomUUID();
  const workspaceId = randomUUID();
  const teamId = randomUUID();
  const projectId = randomUUID();
  const milestoneId = randomUUID();
  const statusId = randomUUID();
  const issueId = randomUUID();
  const now = new Date();
  const workspaceSlug = `${prefix}-ws`;
  const teamKey = "ENG";
  const projectKey = "PRJ";
  const issueIdentifier = `${projectKey}-1`;

  await db.insert(user).values({
    id: userId,
    name: "Integration User",
    email: `${prefix}-${userId}@test.local`,
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(workspace).values({
    id: workspaceId,
    name: "Integration Workspace",
    slug: workspaceSlug,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(workspaceMember).values({
    id: randomUUID(),
    workspaceId,
    userId,
    role: "owner",
    joinedAt: now,
  });

  await db.insert(issueStatus).values({
    id: statusId,
    workspaceId,
    name: "Todo",
    type: "unstarted",
    position: 0,
    color: "var(--primary)",
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(team).values({
    id: teamId,
    workspaceId,
    name: "Engineering",
    key: teamKey,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(teamMember).values({
    id: randomUUID(),
    teamId,
    userId,
    role: "lead",
    createdAt: now,
  });

  await db.insert(project).values({
    id: projectId,
    workspaceId,
    teamId,
    name: "Main Project",
    key: projectKey,
    status: "active",
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(milestone).values({
    id: milestoneId,
    workspaceId,
    projectId,
    name: "MVP",
    status: "in_progress",
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(issue).values({
    id: issueId,
    workspaceId,
    teamId,
    projectId,
    milestoneId,
    identifier: issueIdentifier,
    title: "Seed issue",
    statusId,
    creatorId: userId,
    createdAt: now,
    updatedAt: now,
  });

  return {
    userId,
    email: `${prefix}-${userId}@test.local`,
    workspaceId,
    workspaceSlug,
    teamId,
    teamKey,
    projectId,
    projectKey,
    milestoneId,
    statusId,
    issueId,
    issueIdentifier,
  };
}

export async function cleanupIntegrationSeed(seed: IntegrationSeed) {
  await db.delete(user).where(eq(user.id, seed.userId));
}

export async function mintMcpAccessToken(input: {
  userId: string;
  workspaceId?: string | null;
  scopes?: string[];
  clientId?: string;
}) {
  const clientId = input.clientId ?? "integration-test-client";
  const redirectUri = "http://127.0.0.1:3000/callback";
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = toCodeChallengeS256(codeVerifier);
  const scopes = input.scopes ?? [
    "mcp:read",
    "mcp:write",
    "workspace:read",
    "workspace:write",
  ];

  const code = await createAuthorizationCode({
    userId: input.userId,
    clientId,
    redirectUri,
    codeChallenge,
    codeChallengeMethod: "S256",
    scopes,
    workspaceId: input.workspaceId ?? null,
  });

  const tokenResponse = await exchangeAuthorizationCode({
    clientId,
    code,
    redirectUri,
    codeVerifier,
  });

  if (!tokenResponse) {
    throw new Error("Failed to mint MCP access token for integration tests");
  }

  return tokenResponse.accessToken;
}

export function createMcpAuthExtra(input: {
  userId: string;
  workspaceId?: string | null;
  scopes: string[];
  token?: string;
}) {
  return {
    sessionId: "integration-session",
    authInfo: {
      token: input.token ?? "integration-token",
      clientId: "integration-test-client",
      scopes: input.scopes,
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      extra: {
        userId: input.userId,
        workspaceId: input.workspaceId ?? null,
      },
    },
  };
}
