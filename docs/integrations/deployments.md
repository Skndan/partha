> **Status: Planned.** APIs and UI are subject to change.

# Integration: Deployments

Goal: bind deployment promotions (Vercel, Fly, etc.) to Partha milestones so release readiness is visible in one surface.

## Concepts

- Environment mapping (`preview`, `staging`, `production`) ↔ milestone statuses.
- Deployment status webhooks feeding workspace dashboards + notifications.

## Safety

- Separate deployment credentials per workspace.
- Manual approval gates before production hooks fire automatically.
