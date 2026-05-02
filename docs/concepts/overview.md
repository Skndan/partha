# Concepts overview

Partha models delivery as nested scopes inside a **workspace**:

```text
Workspace
├── Members & invites
├── Teams
│   └── Team members
├── Projects (optional team)
│   └── Milestones (optional project)
└── Issues (may reference team, project, milestone)
```

## Schema source of truth

Table definitions are composed under `lib/db/tables/` and re-exported from `lib/db/schema.ts` (e.g. `workspace`, `team`, `project`, `milestone`, `issue`, `issueStatus`, `notification`, `activityEvent`).

## Primary UI routes

- Workspace shell: `app/[slug]/layout.tsx`, dashboard `app/[slug]/dashboard/page.tsx`
- Teams: `app/[slug]/(team)/teams/page.tsx`, team hub `app/[slug]/(team)/team/[teamKey]/...`
- Projects: `app/[slug]/(project)/projects/all/page.tsx`, `app/[slug]/(project)/project/[projectId]/...`
- Issue detail: `app/[slug]/issues/[issueId]/page.tsx`

## Related docs

- [Workspaces](./workspaces.md) · [Teams](./teams.md) · [Projects](./projects.md) · [Milestones](./milestones.md) · [Issues](./issues.md)
