# CI/CD — Three Independent App Pipelines

Partha uses **Turborepo** plus **GitHub Actions** with one CI workflow and one deploy workflow per app (`app`, `site`, `docs`). Changes under a single app directory only run that app’s pipelines, unless shared monorepo files change.

## Directory structure

```text
.github/
  actions/
    setup-monorepo/
      action.yml              # Shared checkout, Bun, caches, install
    container-version/
      action.yml              # Semver + SHA tags from package.json
  workflows/
    ci-app.yml                # CI for @partha/app
    ci-site.yml               # CI for @partha/site
    ci-docs.yml               # CI for @partha/docs
    deploy-app.yml            # GHCR release + SSH compose (no image override)
    deploy-site.yml
    deploy-docs.yml

apps/
  app/Dockerfile
  site/Dockerfile
  docs/Dockerfile             # Standalone Next.js image (port 4002)

.dockerignore                 # Smaller Docker build context
docker-compose.yml            # APP_IMAGE / SITE_IMAGE / DOCS_IMAGE overrides
```

## Path filter matrix

| Change location | CI App | CI Site | CI Docs | Deploy App | Deploy Site | Deploy Docs |
|-----------------|--------|---------|---------|------------|-------------|-------------|
| `apps/app/**` | yes | | | yes | | |
| `apps/site/**` | | yes | | | yes | |
| `apps/docs/**` | | | yes | | | yes |
| `packages/ui/**` | yes | yes | | yes | yes | |
| `packages/eslint-config/**` | yes | yes | yes | yes | yes | yes |
| `packages/typescript-config/**` | yes | yes | yes | yes | yes | yes |
| `package.json`, `bun.lock`, `turbo.json` | yes | yes | yes | yes | yes | yes |
| `.github/actions/**` | yes | yes | yes | | | |
| Repo-root `docs/**` (contributing guides) | | | | | | |

Workflow-level `paths` filters plus [`dorny/paths-filter@v3`](https://github.com/dorny/paths-filter) ensure PRs only run the relevant jobs. Skipped jobs count as successful for branch protection.

## Caching layers

1. **Bun install** — `~/.bun/install/cache` and root `node_modules`, keyed on `bun.lock`.
2. **Turborepo local** — `.turbo`, keyed on `bun.lock` + `turbo.json` (+ per-app suffix).
3. **Turborepo remote (optional)** — set repository secret `TURBO_TOKEN` and variable `TURBO_TEAM` ([Vercel Remote Cache](https://turbo.build/docs/core-concepts/remote-caching)).
4. **Docker layer cache** — `cache-from` / `cache-to: type=gha` on deploy builds.

CI runs scoped commands, for example:

```bash
bunx turbo run typecheck lint build --filter=@partha/app
```

## GitHub Environments and secrets

Create three environments: **`production-app`**, **`production-site`**, **`production-docs`**.

| Secret / variable | App | Site | Docs | Notes |
|-------------------|-----|------|------|-------|
| `SSH_HOST` | yes | yes | yes | Production server |
| `SSH_USER` | yes | yes | yes | SSH user |
| `SSH_PRIVATE_KEY` | yes | yes | yes | Deploy key |
| `DEPLOY_PATH` | yes | yes | yes | Directory with `docker-compose.yml` |
| `TURBO_TOKEN` (repo) | optional | optional | optional | Remote cache |
| `TURBO_TEAM` (repo var) | optional | optional | optional | Remote cache team slug |

Runtime secrets (`DATABASE_URL`, `BETTER_AUTH_*`, OAuth, R2, etc.) stay on the server in `.env` (see [deploy.md](./deploy.md)). CI uses ephemeral Postgres and `SKIP_ENV_VALIDATION=1` for app tests only.

### Container versioning and tags

Versions come from each app’s `package.json` (`apps/app`, `apps/site`, `apps/docs`). The [`container-version`](../.github/actions/container-version/action.yml) action builds an immutable tag set per release:

| Tag | Example | Purpose |
|-----|---------|---------|
| Semver | `0.1.0` | Primary release pin (matches `package.json`) |
| Semver + SHA | `0.1.0-a1b2c3d` | Traceable build of that version |
| SHA | `sha-a1b2c3d` | Immutable git reference |

Images are **not** tagged by environment name (`production`, `staging`, etc.). Runtime configuration (database URLs, auth secrets, public URLs) lives only in the server `.env` used by Compose.

OCI labels (`org.opencontainers.image.version`, `revision`, `source`, `created`) are applied at build time.

### GHCR images

```text
ghcr.io/<owner-lowercase>/partha-app:0.1.0
ghcr.io/<owner-lowercase>/partha-app:0.1.0-a1b2c3d
ghcr.io/<owner-lowercase>/partha-app:sha-a1b2c3d
```

Same pattern for `partha-site` and `partha-docs`.

On the server, log in once (`docker login ghcr.io`) and ensure the deploy user can pull private packages if needed.

### Compose image pins (server `.env`)

`docker-compose.yml` reads image references from `.env`:

- `APP_IMAGE` (default `partha-app:local` for local builds)
- `SITE_IMAGE`
- `DOCS_IMAGE`

**Promotion flow:** bump `version` in the app’s `package.json`, merge to `main`, CI publishes the new semver tag. Update the server `.env` pin (e.g. `APP_IMAGE=ghcr.io/your-org/partha-app:0.2.0`), then run deploy or `docker compose pull && docker compose up -d`. Deploy workflows do not override `.env` image pins.

## Deploy flow

```mermaid
flowchart LR
  pushMain[push to main] --> pathFilter[path filters]
  pathFilter --> buildPush[docker build-push-action]
  buildPush --> ghcr[GHCR]
  ghcr --> ssh[SSH to server]
  ssh --> compose[docker compose pull/up]
```

- **Automatic:** push to `main` when paths for that app change.
- **Manual:** Actions → *Deploy App* / *Deploy Site* / *Deploy Docs* → **Run workflow** (`workflow_dispatch`).

App deploy also runs `docker compose run --rm migrate` before `up -d app`. Compose uses image pins from the server `.env`; bump the semver in `package.json` and `.env` together when promoting a release.

## Branch protection

Require these checks (names match workflow `name` + job `quality` / `deploy`):

- **CI App** → job `quality`
- **CI Site** → job `quality`
- **CI Docs** → job `quality`

## One-time server setup

1. Clone repo on the server; copy `.env` from `.env.example`.
2. `docker login ghcr.io` with a PAT that can read packages.
3. Configure GitHub Environment secrets (`SSH_*`, `DEPLOY_PATH`).
4. (Optional) Enable Turborepo remote cache in the repository.

---

## Appendix — workflow YAML (canonical copies)

The files below are the source of truth in the repository. Reproduce or edit them at the listed paths.

### `.github/actions/setup-monorepo/action.yml`

```yaml
name: Setup monorepo
description: Checkout, Bun install, and Turborepo-friendly caches for the Partha monorepo
inputs:
  turbo-token:
    description: Optional Turborepo remote cache token (TURBO_TOKEN)
    required: false
  turbo-team:
    description: Optional Turborepo team slug (TURBO_TEAM)
    required: false
  turbo-cache-key-suffix:
    description: Optional suffix for the .turbo cache key (e.g. app name)
    required: false
    default: ""
runs:
  using: composite
  steps:
    - uses: actions/checkout@v4

    - uses: oven-sh/setup-bun@v2
      with:
        bun-version: "1.3.10"

    - uses: actions/cache@v4
      id: bun-cache
      with:
        path: |
          ~/.bun/install/cache
          node_modules
        key: ${{ runner.os }}-bun-${{ hashFiles('bun.lock') }}
        restore-keys: |
          ${{ runner.os }}-bun-

    - uses: actions/cache@v4
      id: turbo-cache
      with:
        path: .turbo
        key: ${{ runner.os }}-turbo-${{ hashFiles('bun.lock', 'turbo.json') }}${{ inputs.turbo-cache-key-suffix }}
        restore-keys: |
          ${{ runner.os }}-turbo-${{ hashFiles('bun.lock', 'turbo.json') }}-
          ${{ runner.os }}-turbo-

    - name: Install dependencies
      run: bun install --frozen-lockfile
      shell: bash

    - name: Disable Turborepo telemetry
      run: bunx turbo telemetry disable
      shell: bash
      env:
        TURBO_TOKEN: ${{ inputs.turbo-token }}
        TURBO_TEAM: ${{ inputs.turbo-team }}
```

### `.github/workflows/ci-app.yml`

See [`.github/workflows/ci-app.yml`](../.github/workflows/ci-app.yml) in the repo (Postgres service, `db:push`, tests, `turbo run` for `@partha/app`).

### `.github/workflows/ci-site.yml`

See [`.github/workflows/ci-site.yml`](../.github/workflows/ci-site.yml).

### `.github/workflows/ci-docs.yml`

See [`.github/workflows/ci-docs.yml`](../.github/workflows/ci-docs.yml).

### `.github/workflows/deploy-app.yml`

See [`.github/workflows/deploy-app.yml`](../.github/workflows/deploy-app.yml) (GHCR push + SSH + migrate).

### `.github/workflows/deploy-site.yml`

See [`.github/workflows/deploy-site.yml`](../.github/workflows/deploy-site.yml).

### `.github/workflows/deploy-docs.yml`

See [`.github/workflows/deploy-docs.yml`](../.github/workflows/deploy-docs.yml).
