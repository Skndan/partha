# Security

This document summarizes how Partha treats authentication sessions, MCP OAuth tokens, development-only helpers, and operational secrets.

## Sessions & authentication

- Sessions are issued by **Better Auth**. Protect secrets (`BETTER_AUTH_SECRET`, provider client secrets).
- Use HTTPS in production; cookies depend on your Better Auth / Next.js cookie configuration.

## MCP OAuth tokens

- Authorization codes and access tokens are persisted for MCP OAuth (`mcp_oauth_authorization_code`, `mcp_oauth_access_token` in the schema exported from `lib/db/schema.ts`).
- Access tokens are stored **hashed** for lookup and **encrypted** for at-rest handling — review server implementation when rotating crypto policies.
- Prefer **short-lived** tokens and **narrow scopes** (`mcp:read`, `mcp:write`, `workspace:read`, `workspace:write`) and workspace-bound tokens when integrating clients.

## Dev-only endpoints

- `/dev/mcp-token` and `POST /api/dev/mcp/token` are **development-only**. Do not enable equivalent shortcuts in production builds.

## Operational hygiene

- Rotate `BETTER_AUTH_SECRET` and OAuth provider secrets on compromise.
- Restrict database credentials and R2 keys via environment isolation per stage.

## Reporting

Add a security contact / policy before public launch; until then, coordinate privately with maintainers.
