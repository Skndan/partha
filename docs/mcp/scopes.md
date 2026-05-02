# MCP scopes

Supported scopes:

| Scope | Meaning |
|-------|---------|
| `mcp:read` | Read issue-related tools + listing issue statuses |
| `mcp:write` | Mutate issues |
| `workspace:read` | Read workspace metadata, teams, projects, milestones |
| `workspace:write` | Create/update workspaces, teams, projects, milestones |

## Workspace binding

- Provide `workspace_slug` during authorize to bind tokens to one workspace.
- Unbound tokens may list all accessible workspaces via `list_workspaces`, but workspace-targeted tools must receive `workspace_slug` arguments where applicable.

## Tool requirements

| Tool(s) | Requirement |
|---------|----------------|
| `ping` | none |
| `whoami` | authenticated token |
| `list_workspaces` | authenticated token |
| `get_workspace` | `workspace:read` |
| `create_workspace`, `update_workspace` | `workspace:write` |
| Team/project/milestone reads | `workspace:read` |
| Team/project/milestone writes | `workspace:write` |
| `list_issue_statuses`, `list_issues`, `get_issue` | `mcp:read` |
| `create_issue`, `update_issue` | `mcp:write` |

Authoritative checks live in `lib/mcp/server.ts` (`requireScope`, `resolveWorkspaceScope`, etc.).
