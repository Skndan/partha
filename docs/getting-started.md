# Getting started

This guide walks you through running **Partha** locally from the [Skndan/partha](https://github.com/Skndan/partha) monorepo. For the product overview, see the [repository README](../README.md) or [concepts overview](./concepts/overview.md).

## Prerequisites

- [Bun](https://bun.sh/) installed
- PostgreSQL reachable from your machine (local or Neon)
- Email/OAuth providers configured if you use those Better Auth methods

## Clone and install

```bash
git clone https://github.com/Skndan/partha.git
cd partha
bun install
```

## Environment

```bash
cp .env.example .env.local
```

Minimum variables (see `.env.example` for full list):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string |
| `BETTER_AUTH_SECRET` | Secret for session/crypto |
| `BETTER_AUTH_URL` | Public origin (e.g. `http://localhost:4000` for local `@partha/app`) |
| `NEXT_PUBLIC_URL` | Same origin, no trailing slash |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | If using Google sign-in |
| `R2_*` | Only if using `/api/upload` with Cloudflare R2 |

Optional marketing links:

- `NEXT_PUBLIC_GITHUB_DOCS_BASE` — GitHub blob base for `/docs` deep links
- `NEXT_PUBLIC_GITHUB_REPO_URL` — Footer repository URL

## Database

Generate or push schema (team preference may vary):

```bash
bun run db:push
```

For migration workflows, use `db:generate` / `db:migrate` as documented in `package.json`.

## Run the app

```bash
bun dev
```

Open **`http://localhost:4000`** when running the main app (`bun run dev:app`). With `bun dev`, Turborepo may start multiple apps—use the URLs printed in the terminal (see root [README](../README.md)).

## First workspace

1. **Sign up** at `/signup` or **log in** at `/login`.
2. If you have no workspace membership, `/onboarding` collects workspace name/slug.
3. After creation you land at `/{workspaceSlug}/dashboard`.

## MCP (optional)

- Dev UI: `/dev/mcp-token` (development only)
- CLI: `bun run mcp:token -- --email user@example.com`
- Docs: [`docs/mcp/index.md`](./mcp/index.md)

## Deploy

See [`deploy.md`](./deploy.md).
