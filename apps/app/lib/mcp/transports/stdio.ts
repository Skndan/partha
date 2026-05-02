import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { JSONRPCMessage, MessageExtraInfo } from "@modelcontextprotocol/sdk/types.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { createMcpServer } from "../server";
import { verifyAccessToken } from "../oauth/service";

class AuthenticatedStdioServerTransport implements Transport {
  constructor(
    private readonly inner: StdioServerTransport,
    private readonly authInfo: AuthInfo,
  ) { }

  onclose?: (() => void) | undefined;
  onerror?: ((error: Error) => void) | undefined;
  onmessage?: (<T extends JSONRPCMessage>(message: T, extra?: MessageExtraInfo) => void) | undefined;
  sessionId?: string | undefined;

  async start() {
    this.inner.onclose = () => this.onclose?.();
    this.inner.onerror = (error) => this.onerror?.(error);
    this.inner.onmessage = (message) => {
      this.onmessage?.(message, { authInfo: this.authInfo });
    };
    await this.inner.start();
  }

  async send(message: JSONRPCMessage) {
    await this.inner.send(message);
  }

  async close() {
    await this.inner.close();
  }

}

export async function startAuthenticatedStdioServer(accessToken: string) {
  const principal = await verifyAccessToken(accessToken);
  if (!principal) {
    throw new Error("Invalid or expired MCP access token");
  }

  const authInfo: AuthInfo = {
    token: accessToken,
    clientId: principal.clientId,
    scopes: principal.scopes,
    expiresAt: principal.expiresAt,
    extra: {
      userId: principal.userId,
      workspaceId: principal.workspaceId,
    },
  };

  const server = createMcpServer();
  const transport = new AuthenticatedStdioServerTransport(
    new StdioServerTransport(),
    authInfo,
  );
  await server.connect(transport);
}
