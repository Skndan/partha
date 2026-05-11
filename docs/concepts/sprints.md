# Sprints

In Partha, **sprints** are timeboxed planning windows scoped to a **project**. Each sprint has a date range, optional goal, and status (`planned`, `active`, or `completed`). Work on a sprint is represented by **existing issues** linked through `sprint_issue` (an issue may belong to at most one sprint at a time).

## Data model

- `sprint` — `workspaceId`, `projectId`, `name`, optional `goal`, `startDate`, `endDate`, `status`, audit fields.
- `sprint_issue` — `sprintId`, `issueId`, `position` (ordering within the sprint). Unique on `issueId`.

Issues retain `teamId`, `assigneeId`, `statusId`, optional `startDate` (for Gantt bars), and `dueDate`.

## UX

- Sprint list & create: `app/[slug]/(project)/project/[projectId]/sprints/page.tsx`
- Sprint planning (Kanban + Gantt): `app/[slug]/(project)/project/[projectId]/sprints/[sprintId]/page.tsx`
- Planning UI uses **kibo-ui** Kanban and Gantt components from `@workspace/ui/components/kibo-ui/*`.

## API

REST routes under `api/workspaces/[slug]/projects/[projectId]/sprints/`:

- List / create sprints
- Get / update / delete a sprint
- Add or reorder sprint issues (`POST` / `PATCH` on `…/sprints/[sprintId]/issues`)
- Remove one issue (`DELETE` …`/issues/[issueId]`)

Issue status and dates continue to use `PATCH /api/workspaces/[slug]/issues/[issueId]`.

## MCP

Issue tools expose `startDate` alongside `dueDate`. Dedicated sprint MCP tools are not registered yet.
