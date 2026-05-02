# Teams

In Partha, **teams** group people and work inside a workspace. Each team has a human-readable **name** and short **key** (normalized uppercase in MCP mutations).

## Data model

- `team` — `workspaceId`, `name`, `key`, `description`, audit fields.
- `team_member` — links users with `team_member_role`: `lead` | `member`.

## UX

- Directory: `app/[slug]/(team)/teams/page.tsx`
- Team hub: `app/[slug]/(team)/team/[teamKey]/all/page.tsx`
- Issues/milestones/projects scoped to team under the same `(team)` segment.

## MCP tools

`list_teams`, `get_team`, `create_team`, `update_team` — scope `workspace:read` / `workspace:write` as described in [`docs/mcp/scopes.md`](../mcp/scopes.md).
