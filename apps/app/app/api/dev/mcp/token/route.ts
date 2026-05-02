import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import {
  createAuthorizationCode,
  exchangeAuthorizationCode,
  resolveWorkspaceForUser,
} from "@/lib/mcp/oauth/service";
import {
  generateCodeVerifier,
  toCodeChallengeS256,
} from "@/lib/mcp/oauth/pkce";
import { normalizeScopes } from "@/lib/mcp/oauth/scopes";

const DevTokenRequestSchema = z.object({
  client_id: z.string().trim().min(1).default("local-dev-ui"),
  workspace_slug: z.string().trim().min(1).optional(),
  scope: z.string().trim().optional(),
});

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = DevTokenRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_request",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  let scopes: string[];
  try {
    scopes = normalizeScopes(parsed.data.scope);
  } catch (error) {
    return NextResponse.json(
      {
        error: "invalid_scope",
        error_description: (error as Error).message,
      },
      { status: 400 },
    );
  }

  const workspaceId = await resolveWorkspaceForUser(
    session.user.id,
    parsed.data.workspace_slug,
  );
  if (parsed.data.workspace_slug && !workspaceId) {
    return NextResponse.json(
      {
        error: "invalid_target",
        error_description: "Unknown workspace for user",
      },
      { status: 400 },
    );
  }

  const redirectUri = "http://localhost:3000/mcp-callback";
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = toCodeChallengeS256(codeVerifier);

  const code = await createAuthorizationCode({
    userId: session.user.id,
    clientId: parsed.data.client_id,
    redirectUri,
    codeChallenge,
    codeChallengeMethod: "S256",
    scopes,
    workspaceId,
  });

  const tokenResponse = await exchangeAuthorizationCode({
    clientId: parsed.data.client_id,
    code,
    redirectUri,
    codeVerifier,
  });

  if (!tokenResponse) {
    return NextResponse.json(
      { error: "server_error", error_description: "Failed to mint access token" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    access_token: tokenResponse.accessToken,
    token_type: tokenResponse.tokenType,
    expires_in: tokenResponse.expiresIn,
    scope: tokenResponse.scope,
  });
}
