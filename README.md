# Partha

![Partha — Plan, Analyze, Reach, Track, Harness, Accelerate](apps/app/public/og-default.png)

**Plan • Analyze • Reach • Track • Harness • Accelerate**

Partha is workspace-scoped delivery software: teams, projects, milestones, and issues in one place, with a **Model Context Protocol (MCP)** server so agents can work alongside your workspace. See the [domain model](docs/concepts/overview.md) for how scopes nest inside a workspace.

## Features

- Workspaces, teams, projects, milestones, issues, notifications, and realtime updates
- Next.js App Router, React 19
- [Bun](https://bun.sh/) package manager and scripts
- [Turborepo](https://turbo.build/) monorepo
- PostgreSQL via [Drizzle ORM](https://orm.drizzle.team/)
- Authentication with [Better Auth](https://www.better-auth.com/)
- MCP for OAuth, scoped tools, and programmatic access

## Monorepo layout

| Package | Path | Role |
|--------|------|------|
| `@partha/app` | `apps/app` | Main product (default dev server **port 4000**) |
| `@partha/site` | `apps/site` | Marketing site (default dev server **port 4001**) |
| `@workspace/ui` | `packages/ui` | Shared shadcn/ui-style components |
| `@workspace/eslint-config` | `packages/eslint-config` | Shared ESLint config |
| `@workspace/typescript-config` | `packages/typescript-config` | Shared TypeScript config |

## Quick start

```bash
git clone https://github.com/Skndan/partha.git
cd partha
bun install
```

Copy env and prepare the database as described in **[Getting started](docs/getting-started.md)** (minimum: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_URL`).

Run all apps via Turborepo:

```bash
bun dev
```

Run a single app:

```bash
bun run dev:app   # @partha/app → http://localhost:4000
bun run dev:site  # @partha/site → http://localhost:4001
```

## Documentation

Full markdown docs live under [`docs/`](docs/). Start at the **[documentation index](docs/README.md)** for concepts, MCP, integrations, deployment, and security.

## Contributing & security

- **[Contributing](docs/contributing.md)** — commits, Bun-only deps, UI conventions, MCP doc updates
- **[Security](docs/security.md)** — auth, sessions, MCP tokens

## License

[MIT](LICENSE)

Repository: **https://github.com/Skndan/partha**
