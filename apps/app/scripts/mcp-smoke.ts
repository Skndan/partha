import { config } from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(scriptDir, "..");

config({ path: resolve(appRoot, ".env"), quiet: true });
config({ path: resolve(appRoot, ".env.local"), quiet: true });

async function main() {
  const accessToken = process.env.MCP_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Set MCP_ACCESS_TOKEN (bun run mcp:token) before running mcp:smoke.");
  }

  const transport = new StdioClientTransport({
    command: "bun",
    args: ["run", "mcp:stdio"],
    cwd: appRoot,
    env: {
      ...process.env,
      MCP_ACCESS_TOKEN: accessToken,
      SKIP_ENV_VALIDATION: "1",
    },
  });

  const client = new Client({ name: "partha-mcp-smoke", version: "1.0.0" });
  await client.connect(transport);

  const ping = await client.callTool({ name: "ping", arguments: {} });
  const pingText = JSON.stringify(ping);
  if (!pingText.includes("pong")) {
    throw new Error(`ping failed: ${pingText}`);
  }

  const whoami = await client.callTool({ name: "whoami", arguments: {} });
  if (!JSON.stringify(whoami).includes("userId")) {
    throw new Error(`whoami failed: ${JSON.stringify(whoami)}`);
  }

  const workspaces = await client.callTool({
    name: "list_workspaces",
    arguments: {},
  });
  const workspacePayload = JSON.stringify(workspaces);
  if (!workspacePayload.includes("workspaces")) {
    throw new Error(`list_workspaces failed: ${workspacePayload}`);
  }

  const slugMatch = workspacePayload.match(/"slug":"([^"]+)"/);
  const workspaceSlug = slugMatch?.[1];
  if (!workspaceSlug) {
    throw new Error("list_workspaces did not return a workspace slug");
  }

  const issues = await client.callTool({
    name: "list_issues",
    arguments: { workspace_slug: workspaceSlug },
  });
  if (!JSON.stringify(issues).includes("issues")) {
    throw new Error(`list_issues failed: ${JSON.stringify(issues)}`);
  }

  await client.close();
  console.log("[mcp-smoke] ok");
}

main().catch((error) => {
  console.error("[mcp-smoke] failed", error);
  process.exit(1);
});
