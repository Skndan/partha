import { describe, expect, test } from "bun:test";
import { createMcpServer } from "@/lib/mcp/server";

type RegisteredTool = {
  handler: (input: unknown, extra?: unknown) => Promise<unknown>;
};

type McpServerWithTools = ReturnType<typeof createMcpServer> & {
  _registeredTools: Record<string, RegisteredTool>;
};

const expectedToolNames = [
  "ping",
  "whoami",
  "list_workspaces",
  "get_workspace",
  "create_workspace",
  "update_workspace",
  "list_teams",
  "get_team",
  "create_team",
  "update_team",
  "list_projects",
  "get_project",
  "create_project",
  "update_project",
  "list_milestones",
  "get_milestone",
  "create_milestone",
  "update_milestone",
  "list_issue_statuses",
  "list_issues",
  "get_issue",
  "create_issue",
  "update_issue",
];

function getRegisteredTools() {
  const server = createMcpServer() as McpServerWithTools;
  return server._registeredTools;
}

function createAuthExtra(overrides?: {
  scopes?: string[];
  workspaceId?: string | null;
}) {
  return {
    sessionId: "session-123",
    authInfo: {
      token: "token-123",
      clientId: "client-123",
      scopes: overrides?.scopes ?? ["mcp:read", "mcp:write", "workspace:read", "workspace:write"],
      expiresAt: Date.now() + 60_000,
      extra: {
        userId: "user-123",
        workspaceId: overrides?.workspaceId ?? "workspace-123",
      },
    },
  };
}

describe("mcp server tools", () => {
  test("registers the expected tool set", () => {
    const tools = getRegisteredTools();
    const actualToolNames = Object.keys(tools).sort();

    expect(actualToolNames).toEqual([...expectedToolNames].sort());
  });

  test("all authenticated tools reject when auth context is missing", async () => {
    const tools = getRegisteredTools();
    const authenticatedTools = expectedToolNames.filter((name) => name !== "ping");

    for (const toolName of authenticatedTools) {
      await expect(tools[toolName]!.handler({})).rejects.toThrow("Unauthorized");
    }
  });

  test("whoami reads auth from request extra context", async () => {
    const tools = getRegisteredTools();

    const response = (await tools.whoami!.handler(
      {},
      createAuthExtra({ scopes: ["mcp:read"] }),
    )) as {
      content: Array<{ type: string; text: string }>;
      structuredContent: Record<string, unknown>;
    };

    expect(response.content[0]?.text).toContain("user-123");
    expect(response.structuredContent).toMatchObject({
      userId: "user-123",
      workspaceId: "workspace-123",
      scopes: ["mcp:read"],
      sessionId: "session-123",
    });
  });

  test("create_issue returns schema/validation errors when auth is present", async () => {
    const tools = getRegisteredTools();

    await expect(
      tools.create_issue!.handler(
        {},
        createAuthExtra({ scopes: ["mcp:write"] }),
      ),
    ).rejects.not.toThrow("Unauthorized");
  });

  test("list_issue_statuses returns schema/validation errors when auth is present", async () => {
    const tools = getRegisteredTools();

    await expect(
      tools.list_issue_statuses!.handler(
        { unexpected: true },
        createAuthExtra({ scopes: ["mcp:read"] }),
      ),
    ).rejects.not.toThrow("Unauthorized");
  });

  test("ping works without auth", async () => {
    const tools = getRegisteredTools();
    const response = (await tools.ping!.handler({})) as {
      content: Array<{ text: string }>;
    };
    expect(response.content[0]?.text).toBe("pong");
  });
});

const toolScopeRequirements: Record<string, string | null> = {
  ping: null,
  whoami: null,
  list_workspaces: null,
  get_workspace: "workspace:read",
  create_workspace: "workspace:write",
  update_workspace: "workspace:write",
  list_teams: "workspace:read",
  get_team: "workspace:read",
  create_team: "workspace:write",
  update_team: "workspace:write",
  list_projects: "workspace:read",
  get_project: "workspace:read",
  create_project: "workspace:write",
  update_project: "workspace:write",
  list_milestones: "workspace:read",
  get_milestone: "workspace:read",
  create_milestone: "workspace:write",
  update_milestone: "workspace:write",
  list_issue_statuses: "mcp:read",
  list_issues: "mcp:read",
  get_issue: "mcp:read",
  create_issue: "mcp:write",
  update_issue: "mcp:write",
};

describe("mcp server scope enforcement", () => {
  test("scoped tools reject missing scopes with a clear error", async () => {
    const tools = getRegisteredTools();

    for (const [toolName, requiredScope] of Object.entries(toolScopeRequirements)) {
      if (!requiredScope) {
        continue;
      }

      await expect(
        tools[toolName]!.handler({}, createAuthExtra({ scopes: [] })),
      ).rejects.toThrow(`Missing required scope: ${requiredScope}`);
    }
  });

  test("whoami succeeds with auth but without oauth scopes", async () => {
    const tools = getRegisteredTools();
    const response = await tools.whoami!.handler({}, createAuthExtra({ scopes: [] }));
    expect(response).toBeDefined();
  });
});
