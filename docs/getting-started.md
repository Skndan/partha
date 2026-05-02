# Getting started

## Prerequisites

- [Bun](https://bun.sh/) installed
- PostgreSQL reachable from your machine (local or Neon)
- Email/OAuth providers configured if you use those Better Auth methods

## Clone and install

```bash
git clone <your-fork-or-repo-url>
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
| `BETTER_AUTH_URL` | Public origin (e.g. `http://localhost:3000`) |
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

Visit `http://localhost:3000`.

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
