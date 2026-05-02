import { randomUUID } from "crypto";
import { and, eq, isNull, gt } from "drizzle-orm";
import { db } from "../../db/db";
import {
  mcpOauthAccessToken,
  mcpOauthAuthorizationCode,
  workspace,
  workspaceMember,
} from "../../db/schema";
import {
  MCP_OAUTH_ACCESS_TOKEN_TTL_SECONDS,
  MCP_OAUTH_CODE_TTL_SECONDS,
} from "../constants";
import {
  createOpaqueToken,
  encryptText,
  sha256Hex,
} from "./crypto";

export type McpPrincipal = {
  userId: string;
  clientId: string;
  scopes: string[];
  workspaceId: string | null;
  expiresAt: number;
};

export type CreateAuthorizationCodeInput = {
  userId: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
  scopes: string[];
  workspaceId?: string | null;
};

export async function resolveWorkspaceForUser(
  userId: string,
  workspaceSlug?: string | null,
) {
  if (!workspaceSlug) {
    return null;
  }

  const [membership] = await db
    .select({ workspaceId: workspace.id })
    .from(workspaceMember)
    .innerJoin(workspace, eq(workspace.id, workspaceMember.workspaceId))
    .where(
      and(eq(workspaceMember.userId, userId), eq(workspace.slug, workspaceSlug)),
    )
    .limit(1);

  return membership?.workspaceId ?? null;
}

export async function createAuthorizationCode(input: CreateAuthorizationCodeInput) {
  const code = createOpaqueToken("mcp_code");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + MCP_OAUTH_CODE_TTL_SECONDS * 1000);

  await db.insert(mcpOauthAuthorizationCode).values({
    id: randomUUID(),
    userId: input.userId,
    workspaceId: input.workspaceId ?? null,
    clientId: input.clientId,
    redirectUri: input.redirectUri,
    codeHash: sha256Hex(code),
    codeChallenge: input.codeChallenge,
    codeChallengeMethod: input.codeChallengeMethod,
    scopes: input.scopes.join(" "),
    createdAt: now,
    expiresAt,
  });

  console.info("[mcp-oauth] authorization code issued", {
    clientId: input.clientId,
    userId: input.userId,
    workspaceId: input.workspaceId ?? null,
    expiresAt: expiresAt.toISOString(),
  });

  return code;
}

export async function exchangeAuthorizationCode(input: {
  clientId: string;
  code: string;
  redirectUri: string;
  codeVerifier: string;
}) {
  const now = new Date();
  const [storedCode] = await db
    .select()
    .from(mcpOauthAuthorizationCode)
    .where(
      and(
        eq(mcpOauthAuthorizationCode.clientId, input.clientId),
        eq(mcpOauthAuthorizationCode.redirectUri, input.redirectUri),
        eq(mcpOauthAuthorizationCode.codeHash, sha256Hex(input.code)),
        isNull(mcpOauthAuthorizationCode.usedAt),
        isNull(mcpOauthAuthorizationCode.revokedAt),
        gt(mcpOauthAuthorizationCode.expiresAt, now),
      ),
    )
    .limit(1);

  if (!storedCode) {
    return null;
  }

  const verifierChallenge = Buffer.from(
    sha256Hex(input.codeVerifier),
    "hex",
  ).toString("base64url");
  if (storedCode.codeChallengeMethod !== "S256") {
    return null;
  }
  if (storedCode.codeChallenge !== verifierChallenge) {
    return null;
  }

  await db
    .update(mcpOauthAuthorizationCode)
    .set({ usedAt: now })
    .where(eq(mcpOauthAuthorizationCode.id, storedCode.id));

  const accessToken = createOpaqueToken("mcp_at");
  const expiresAt = new Date(now.getTime() + MCP_OAUTH_ACCESS_TOKEN_TTL_SECONDS * 1000);
  await db.insert(mcpOauthAccessToken).values({
    id: randomUUID(),
    userId: storedCode.userId,
    workspaceId: storedCode.workspaceId,
    clientId: storedCode.clientId,
    tokenHash: sha256Hex(accessToken),
    encryptedToken: encryptText(accessToken),
    scopes: storedCode.scopes,
    createdAt: now,
    expiresAt,
  });

  console.info("[mcp-oauth] access token issued", {
    clientId: storedCode.clientId,
    userId: storedCode.userId,
    workspaceId: storedCode.workspaceId ?? null,
    expiresAt: expiresAt.toISOString(),
  });

  return {
    accessToken,
    tokenType: "Bearer" as const,
    expiresIn: MCP_OAUTH_ACCESS_TOKEN_TTL_SECONDS,
    scope: storedCode.scopes,
  };
}

export async function verifyAccessToken(token: string): Promise<McpPrincipal | null> {
  const now = new Date();
  const [storedToken] = await db
    .select()
    .from(mcpOauthAccessToken)
    .where(
      and(
        eq(mcpOauthAccessToken.tokenHash, sha256Hex(token)),
        isNull(mcpOauthAccessToken.revokedAt),
        gt(mcpOauthAccessToken.expiresAt, now),
      ),
    )
    .limit(1);

  if (!storedToken) {
    return null;
  }

  await db
    .update(mcpOauthAccessToken)
    .set({ lastUsedAt: now })
    .where(eq(mcpOauthAccessToken.id, storedToken.id))
    .catch(() => undefined);

  return {
    userId: storedToken.userId,
    clientId: storedToken.clientId,
    scopes: storedToken.scopes.split(" ").filter(Boolean),
    workspaceId: storedToken.workspaceId ?? null,
    expiresAt: Math.floor(storedToken.expiresAt.getTime() / 1000),
  };
}

export async function revokeAccessToken(token: string) {
  console.info("[mcp-oauth] access token revoked");
  await db
    .update(mcpOauthAccessToken)
    .set({ revokedAt: new Date() })
    .where(eq(mcpOauthAccessToken.tokenHash, sha256Hex(token)));
}
