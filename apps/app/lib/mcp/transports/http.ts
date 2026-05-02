import { randomUUID } from "crypto";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { createMcpServer } from "../server";
import {
  resolveAuthInfoFromRequest,
  unauthorizedResponse,
} from "@/lib/mcp/oauth/http";

type McpHttpSession = {
  server: ReturnType<typeof createMcpServer>;
  transport: WebStandardStreamableHTTPServerTransport;
  authInfo: AuthInfo;
};

const sessions = new Map<string, McpHttpSession>();

function samePrincipal(a: AuthInfo, b: AuthInfo) {
  return (
    a.clientId === b.clientId &&
    (a.extra as { userId?: string } | undefined)?.userId ===
    (b.extra as { userId?: string } | undefined)?.userId
  );
}

async function createSession(authInfo: AuthInfo) {
  const server = createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sessionId) => {
      sessions.set(sessionId, {
        server,
        transport,
        authInfo,
      });
    },
  });

  transport.onclose = () => {
    if (transport.sessionId) {
      sessions.delete(transport.sessionId);
    }
  };
  transport.onerror = (error) => {
    console.error("[mcp-http] transport error", error);
  };

  await server.connect(transport);
  return {
    server,
    transport,
    authInfo,
  } as McpHttpSession;
}

export async function handleMcpHttpRequest(request: Request) {
  const sessionId = request.headers.get("mcp-session-id");
  const isPost = request.method === "POST";
  const parsedBody = isPost ? await request.json().catch(() => null) : undefined;

  let session = sessionId ? sessions.get(sessionId) : undefined;
  let authInfo = await resolveAuthInfoFromRequest(request);

  if (session) {
    if (!authInfo) {
      authInfo = session.authInfo;
    } else if (!samePrincipal(session.authInfo, authInfo)) {
      console.warn("[mcp-http] bearer token principal mismatch for existing session");
      return unauthorizedResponse(request);
    } else {
      session.authInfo = authInfo;
    }
  }

  if (!session) {
    if (!isPost || !parsedBody || !isInitializeRequest(parsedBody)) {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: missing initialization for MCP session",
          },
          id: null,
        }),
        {
          status: 400,
          headers: {
            "content-type": "application/json",
          },
        },
      );
    }

    if (!authInfo) {
      console.warn("[mcp-http] initialization rejected due to missing bearer token");
      return unauthorizedResponse(request);
    }

    session = await createSession(authInfo);
  }

  return session.transport.handleRequest(request, {
    parsedBody,
    authInfo: session.authInfo,
  });
}
