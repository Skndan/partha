# Concepts overview

These pages describe how **Partha** structures product data and UI. Partha models delivery as nested scopes inside a **workspace**:

```text
Workspace
├── Members & invites
├── Teams
│   └── Team members
├── Projects (optional team)
│   ├── Milestones (optional project)
│   └── Sprints (timeboxed planning; issues linked via sprint_issue)
└── Issues (may reference team, project, milestone)
```

## Schema source of truth

Table definitions are composed under `lib/db/tables/` and re-exported from `lib/db/schema.ts` (e.g. `workspace`, `team`, `project`, `milestone`, `issue`, `issueStatus`, `notification`, `activityEvent`).

## Primary UI routes

- Workspace shell: `app/[slug]/layout.tsx`, dashboard `app/[slug]/dashboard/page.tsx`
- Teams: `app/[slug]/(team)/teams/page.tsx`, team hub `app/[slug]/(team)/team/[teamKey]/...`
- Projects: `app/[slug]/(project)/projects/all/page.tsx`, `app/[slug]/(project)/project/[projectId]/...` (includes **Sprints** under `project/[projectId]/sprints`)
- Issue detail: `app/[slug]/issues/[issueId]/page.tsx`

## Related docs

- [Workspaces](./workspaces.md) · [Teams](./teams.md) · [Projects](./projects.md) · [Milestones](./milestones.md) · [Sprints](./sprints.md) · [Issues](./issues.md)
