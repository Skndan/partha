import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

const INIT_BODY = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "test-client", version: "1.0.0" },
  },
};

const testAuthInfo: AuthInfo = {
  token: "test-token",
  clientId: "test-client",
  scopes: ["mcp:read", "mcp:write", "workspace:read", "workspace:write"],
  expiresAt: Math.floor(Date.now() / 1000) + 3600,
  extra: {
    userId: "user-test",
    workspaceId: null,
  },
};

let resolvedAuth: AuthInfo | null = null;

mock.module("@/lib/mcp/oauth/http", () => ({
  resolveAuthInfoFromRequest: async () => resolvedAuth,
  unauthorizedResponse: (request: Request) => {
    const origin = new URL(request.url).origin;
    return new Response(
      JSON.stringify({
        error: "invalid_token",
        error_description: "Missing or invalid bearer token",
      }),
      {
        status: 401,
        headers: {
          "content-type": "application/json",
          "WWW-Authenticate": `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource/api/mcp"`,
        },
      },
    );
  },
}));

function createInitRequest(options?: { token?: string; sessionId?: string }) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
  };
  if (options?.token) {
    headers.authorization = `Bearer ${options.token}`;
  }
  if (options?.sessionId) {
    headers["mcp-session-id"] = options.sessionId;
  }

  return new Request("http://localhost:4000/api/mcp", {
    method: "POST",
    headers,
    body: JSON.stringify(INIT_BODY),
  });
}

async function loadHttpTransport() {
  return import("@/lib/mcp/transports/http");
}

describe("mcp http transport", () => {
  beforeEach(() => {
    resolvedAuth = testAuthInfo;
  });

  afterEach(async () => {
    resolvedAuth = null;
    const { resetMcpHttpSessionsForTests } = await loadHttpTransport();
    resetMcpHttpSessionsForTests();
  });

  test("rejects non-initialize POST without session", async () => {
    const { handleMcpHttpRequest } = await loadHttpTransport();
    const response = await handleMcpHttpRequest(
      new Request("http://localhost:4000/api/mcp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/list",
          params: {},
        }),
      }),
    );

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error?: { message?: string } };
    expect(body.error?.message).toContain("missing initialization");
  });

  test("rejects initialize without bearer token", async () => {
    resolvedAuth = null;
    const { handleMcpHttpRequest } = await loadHttpTransport();
    const response = await handleMcpHttpRequest(createInitRequest());
    expect(response.status).toBe(401);
  });

  test("accepts initialize with bearer token", async () => {
    const { handleMcpHttpRequest } = await loadHttpTransport();
    const response = await handleMcpHttpRequest(
      createInitRequest({ token: "test-token" }),
    );
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(400);
  });

  test("rejects principal mismatch for existing session", async () => {
    const { handleMcpHttpRequest, resetMcpHttpSessionsForTests } = await loadHttpTransport();
    resetMcpHttpSessionsForTests();

    const first = await handleMcpHttpRequest(createInitRequest({ token: "test-token" }));
    const sessionId = first.headers.get("mcp-session-id");
    expect(sessionId).toBeTruthy();

    resolvedAuth = {
      ...testAuthInfo,
      extra: { userId: "other-user", workspaceId: null },
    };

    const second = await handleMcpHttpRequest(
      createInitRequest({ token: "other-token", sessionId: sessionId! }),
    );
    expect(second.status).toBe(401);
  });
});
