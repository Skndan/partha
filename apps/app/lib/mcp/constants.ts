export const MCP_SERVER_INFO = {
  name: "partha-mcp",
  version: "0.1.0",
};

export const MCP_OAUTH_SCOPES = [
  "mcp:read",
  "mcp:write",
  "workspace:read",
  "workspace:write",
] as const;

export const DEFAULT_MCP_SCOPE = "mcp:read workspace:read";

export const MCP_OAUTH_CODE_TTL_SECONDS = 10 * 60;
export const MCP_OAUTH_ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
