/** Curated from `lib/mcp/server.ts` — update when tools change. */
export type McpToolRow = {
  name: string;
  description: string;
  scopes: string;
};

export const MCP_TOOLS: McpToolRow[] = [
  { name: "ping", description: "Health check for MCP connectivity.", scopes: "—" },
  {
    name: "whoami",
    description: "Returns authenticated principal context (userId, workspace binding, scopes).",
    scopes: "Authenticated token",
  },
  {
    name: "list_workspaces",
    description: "List workspaces for the user.",
    scopes: "Authenticated token",
  },
  {
    name: "get_workspace",
    description: "Get workspace by slug or token-bound workspace.",
    scopes: "workspace:read",
  },
  {
    name: "create_workspace",
    description: "Create workspace and seed default issue statuses.",
    scopes: "workspace:write",
  },
  {
    name: "update_workspace",
    description: "Update workspace metadata.",
    scopes: "workspace:write",
  },
  {
    name: "list_teams",
    description: "List teams in workspace.",
    scopes: "workspace:read",
  },
  {
    name: "get_team",
    description: "Get team by ID.",
    scopes: "workspace:read",
  },
  { name: "create_team", description: "Create team.", scopes: "workspace:write" },
  { name: "update_team", description: "Update team.", scopes: "workspace:write" },
  {
    name: "list_projects",
    description: "List projects with filters.",
    scopes: "workspace:read",
  },
  {
    name: "get_project",
    description: "Get project by ID.",
    scopes: "workspace:read",
  },
  {
    name: "create_project",
    description: "Create project.",
    scopes: "workspace:write",
  },
  {
    name: "update_project",
    description: "Update project fields.",
    scopes: "workspace:write",
  },
  {
    name: "list_milestones",
    description: "List milestones.",
    scopes: "workspace:read",
  },
  {
    name: "get_milestone",
    description: "Get milestone by ID.",
    scopes: "workspace:read",
  },
  {
    name: "create_milestone",
    description: "Create milestone.",
    scopes: "workspace:write",
  },
  {
    name: "update_milestone",
    description: "Update milestone.",
    scopes: "workspace:write",
  },
  {
    name: "list_issue_statuses",
    description: "List workspace issue statuses for create/update issue.",
    scopes: "mcp:read",
  },
  {
    name: "list_issues",
    description: "List issues with filters.",
    scopes: "mcp:read",
  },
  {
    name: "get_issue",
    description: "Get issue with labels and relations.",
    scopes: "mcp:read",
  },
  {
    name: "create_issue",
    description: "Create issue (prefers status/labels by name).",
    scopes: "mcp:write",
  },
  {
    name: "update_issue",
    description: "Update issue fields.",
    scopes: "mcp:write",
  },
];
