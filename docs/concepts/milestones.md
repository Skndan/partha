# Milestones

In Partha, **milestones** represent checkpoints or releases. They are workspace-scoped and optionally tied to a **project**.

## Data model

- `milestone` — `workspaceId`, optional `projectId`, `name`, `description`, `targetDate`, `status` (`milestone_status_enum`), audit fields.

## UX

- Project overview surfaces milestones via `components/linear/project-overview-milestones.tsx`.
- Team milestone boards live under `app/[slug]/(team)/team/[teamKey]/milestones/page.tsx`.

## MCP tools

`list_milestones`, `get_milestone`, `create_milestone`, `update_milestone`.
