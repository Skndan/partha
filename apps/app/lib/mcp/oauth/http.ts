import { NextResponse } from "next/server";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { verifyAccessToken } from "@/lib/mcp/oauth/service";

const RESOURCE_METADATA_URL = "/.well-known/oauth-protected-resource/api/mcp";
const AUTH_SERVER_METADATA_URL = "/.well-known/oauth-authorization-server";

function buildUnauthorizedResponse(request: Request) {
  const origin = new URL(request.url).origin;
  const resourceMetadataUrl = `${origin}${RESOURCE_METADATA_URL}`;
  const authServerMetadataUrl = `${origin}${AUTH_SERVER_METADATA_URL}`;

  const response = NextResponse.json(
    {
      error: "invalid_token",
      error_description: "Missing or invalid bearer token",
    },
    { status: 401 },
  );

  response.headers.set(
    "WWW-Authenticate",
    `Bearer resource_metadata="${resourceMetadataUrl}", authorization_server="${authServerMetadataUrl}"`,
  );

  return response;
}

export async function resolveAuthInfoFromRequest(request: Request): Promise<AuthInfo | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return null;
  }

  const principal = await verifyAccessToken(token);
  if (!principal) {
    return null;
  }

  return {
    token,
    clientId: principal.clientId,
    scopes: principal.scopes,
    expiresAt: principal.expiresAt,
    extra: {
      userId: principal.userId,
      workspaceId: principal.workspaceId,
    },
  };
}

export function unauthorizedResponse(request: Request) {
  return buildUnauthorizedResponse(request);
}
