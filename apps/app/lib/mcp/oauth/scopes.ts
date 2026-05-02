import { DEFAULT_MCP_SCOPE, MCP_OAUTH_SCOPES } from "@/lib/mcp/constants";

const allowedScopes = new Set(MCP_OAUTH_SCOPES);

export function normalizeScopes(rawScope?: string | null) {
  const value = rawScope?.trim() || DEFAULT_MCP_SCOPE;
  const scopes = value.split(/\s+/).filter(Boolean);

  if (scopes.length === 0) {
    return DEFAULT_MCP_SCOPE.split(" ");
  }

  for (const scope of scopes) {
    if (!allowedScopes.has(scope as (typeof MCP_OAUTH_SCOPES)[number])) {
      throw new Error(`Unsupported scope: ${scope}`);
    }
  }

  return scopes;
}
