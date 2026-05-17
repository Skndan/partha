# Deploy Partha (Docker)

This guide covers production-style deployment of the Partha web app with Docker, Postgres, Nginx, and TLS. For local development, see [getting started](http://localhost:4002/docs/getting-started) in the hosted docs.

## Prerequisites

1. A DNS name pointing at your server (for HTTPS).
2. Docker and Docker Compose installed.
3. Local secrets in `.env.local` (copy from [`.env.example`](../.env.example) at the repo root and fill values).

## One-shot SSL + compose

From the repository root:

```bash
./scripts/deploy-ssl-and-up.sh your-domain.com
```

Example:

```bash
./scripts/deploy-ssl-and-up.sh app.example.com
```

The script typically:

- Starts Postgres
- Obtains a Let’s Encrypt certificate
- Starts Nginx as reverse proxy
- Starts the Next.js app
- Applies database migrations as needed

## After deploy

Open:

```text
https://your-domain.com
```

## Useful commands

Stop everything:

```bash
docker compose down
```

Running containers:

```bash
docker compose ps
```

Logs:

```bash
docker compose logs -f
```

## Environment files

The deployment script may sync `.env` from `.env.local` for Docker. Keep production secrets out of git.

For Partha-specific runtime variables, see [getting started](http://localhost:4002/docs/getting-started), [`.env.example`](../.env.example) (Compose / deploy), and [`apps/app/.env.example`](../apps/app/.env.example) (local dev).

## CI/CD

GitHub Actions publishes semver-tagged images to GHCR; pin `APP_IMAGE`, `SITE_IMAGE`, and `DOCS_IMAGE` in the server `.env` (see `.env.example`). See [cicd.md](./cicd.md).
