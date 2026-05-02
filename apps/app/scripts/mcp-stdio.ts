import { config } from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");

// Load local env files for standalone tsx execution regardless of process cwd.
config({ path: resolve(repoRoot, ".env"), quiet: true });
config({ path: resolve(repoRoot, ".env.local"), quiet: true });

async function main() {
  const { startAuthenticatedStdioServer } = await import(
    "../lib/mcp/transports/stdio"
  );
  const accessToken = process.env.MCP_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("Missing MCP_ACCESS_TOKEN for stdio MCP server.");
  }

  await startAuthenticatedStdioServer(accessToken);
  console.error("[mcp-stdio] server started");
}

main().catch((error) => {
  console.error("[mcp-stdio] failed to start", error);
  process.exit(1);
});
