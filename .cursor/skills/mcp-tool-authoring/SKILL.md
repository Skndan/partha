---
name: mcp-tool-authoring
description: Guides implementation of new MCP tools in this Partha repo using the existing server, auth, schema, test, and docs patterns. Use when adding, writing, extending, or reviewing MCP tools, Model Context Protocol tools, AI agent tools, or the MCP server surface.
---

# MCP Tool Authoring

## When To Use

Use this skill before adding or changing MCP tools in `apps/app/lib/mcp/server.ts`.

Do not use it for OAuth-only, transport-only, or client setup work unless the change also modifies the MCP tool surface.

## Required Workflow

1. Read the existing nearby tool family in `apps/app/lib/mcp/server.ts`.
2. Add or update Zod input schemas near related schemas.
3. Register the tool in `createMcpServer()` beside the matching domain family.
4. Enforce auth first:
   - `requireMcpAuth(extra)` for every non-public tool.
   - `requireScope(extra?.authInfo?.scopes, "...")` with the narrowest existing scope.
   - `resolveWorkspaceScope(auth.userId, auth.workspaceId, parsed.workspace_slug)` for workspace data.
   - `requireWorkspaceWriteRole(role)` before workspace write mutations that require owner/admin.
5. Validate every cross-entity reference belongs to `targetWorkspace.id` before writing.
6. Return with `toolTextResult()` and structured content.
7. Update tests, docs, and marketing mirrors in the same change.
8. Run verification before claiming the tool works.

## Existing Scope Map

- Diagnostics: `ping` is public; `whoami` requires authenticated token.
- Workspace/team/project/milestone reads: `workspace:read`.
- Workspace/team/project/milestone writes: `workspace:write` plus owner/admin role where mutating existing workspace-owned data.
- Issue reads/status listing: `mcp:read`.
- Issue writes: `mcp:write`.

Prefer these existing scopes. Do not invent a new OAuth scope without also updating constants, validators, docs, tests, and discovery behavior.

## Files To Update

- Implementation: `apps/app/lib/mcp/server.ts`
- Unit tests: `apps/app/lib/mcp/server.test.ts`
- Integration tests when DB behavior changes: `apps/app/lib/mcp/integration/tools.test.ts`
- Docs: `apps/docs/content/docs/mcp/tools-reference.mdx`
- Marketing mirror: `apps/site/lib/marketing/mcp-tools.ts`
- Package script only when adding a new test file: `apps/app/package.json`

For detailed implementation and verification rules, see [REFERENCE.md](REFERENCE.md).

## Verification

Run from `apps/app`:

```bash
bun run test
```

If database behavior changed and a real `DATABASE_URL` is configured:

```bash
SKIP_ENV_VALIDATION=1 RUN_INTEGRATION_TESTS=1 bun test lib/mcp/integration/tools.test.ts
```

Before finishing, check edited files with lints and state any typecheck limitations honestly.
