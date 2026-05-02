# MCP server overview

Partha exposes an MCP server with **OAuth (PKCE)** for hosted HTTP clients and a **stdio** entrypoint for local tooling.

## Capabilities

### OAuth / discovery

- `GET /api/mcp/oauth/authorize`
- `POST /api/mcp/oauth/token`
- `POST /api/mcp/oauth/revoke`
- `GET /.well-known/oauth-authorization-server`
- `GET /.well-known/oauth-protected-resource/api/mcp`
- Dynamic registration helper: `POST /api/mcp/oauth/register` (see implementation in `app/api/mcp/oauth/register/route.ts`)

### Transport

- HTTP: `GET|POST|DELETE /api/mcp` → `handleMcpHttpRequest` (`app/api/mcp/route.ts`)
- Stdio: `bun run mcp:stdio` (`scripts/mcp-stdio.ts`)

### Tools (summary)

Diagnostics: `ping`, `whoami`

Workspaces: `list_workspaces`, `get_workspace`, `create_workspace`, `update_workspace`

Teams: `list_teams`, `get_team`, `create_team`, `update_team`

Projects: `list_projects`, `get_project`, `create_project`, `update_project`

Milestones: `list_milestones`, `get_milestone`, `create_milestone`, `update_milestone`

Issues: `list_issue_statuses`, `list_issues`, `get_issue`, `create_issue`, `update_issue`

Authoritative registration lives in `lib/mcp/server.ts`; the marketing site mirrors names in `lib/marketing/mcp-tools.ts`.

## Documentation map

| Topic | Doc |
|-------|-----|
| OAuth flow | [oauth.md](./oauth.md) |
| Scopes vs tools | [scopes.md](./scopes.md) |
| Tool inputs/outputs | [tools-reference.md](./tools-reference.md) |
| Pagination | [pagination.md](./pagination.md) |
| Dev tokens | [dev-tokens.md](./dev-tokens.md) |
| Cursor | [clients/cursor.md](./clients/cursor.md) |
| Claude | [clients/claude.md](./clients/claude.md) |
| OpenClaw | [clients/openclaw.md](./clients/openclaw.md) |
| Stdio | [clients/stdio.md](./clients/stdio.md) |

## Storage

OAuth artifacts persist in `mcp_oauth_authorization_code` and `mcp_oauth_access_token` (see `lib/db/schema.ts`). Tokens are hashed for lookup and encrypted for storage — review server crypto helpers before production hardening.

## MVP stance

Today’s MCP layer prioritizes **secure connectivity**, **scoped authorization**, and **workspace/issue automation**. Expand tools deliberately alongside UI parity and governance requirements.
