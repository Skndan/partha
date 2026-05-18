# MCP Tool Authoring Reference

## Implementation Checklist

- Place schemas near related tool schemas in `apps/app/lib/mcp/server.ts`.
- Use `.strict()` on object inputs.
- Include `workspace_slug` as optional when the tool can use a workspace-bound token.
- For pagination, reuse `PaginationInputSchema`, `resolvePagination()`, and `buildPageInfo()`.
- For read tools, filter every query by `targetWorkspace.id`.
- For write tools, validate foreign keys against `targetWorkspace.id` before mutation.
- For mutations, insert activity events when the same product UI path already does.
- Keep returned `structuredContent` stable and small.

## Tool Registration Pattern

```ts
server.registerTool(
  "tool_name",
  {
    title: "Tool Name",
    description: "Describe when an agent should use this tool.",
    inputSchema: ToolInputSchema.shape,
  },
  async (input, extra) => {
    const auth = requireMcpAuth(extra);
    requireScope(extra?.authInfo?.scopes, "workspace:read");
    const parsed = ToolInputSchema.parse(input);
    const targetWorkspace = await resolveWorkspaceScope(
      auth.userId,
      auth.workspaceId,
      parsed.workspace_slug,
    );

    return toolTextResult("Result summary.", {
      result: {},
    });
  },
);
```

## Write Authorization Pattern

Use this pattern before mutating workspace-owned project, team, milestone, or similar administrative data:

```ts
const role = await getWorkspaceMemberRole(auth.userId, targetWorkspace.id);
requireWorkspaceWriteRole(role);
```

This must fail closed. Missing membership is not allowed.

## Tests To Add

For every new tool:

- Add the tool name to `expectedToolNames` in `apps/app/lib/mcp/server.test.ts`.
- Add its required scope to `toolScopeRequirements`.
- Add schema/auth smoke coverage if the tool has unusual input rules.
- Add integration coverage in `apps/app/lib/mcp/integration/tools.test.ts` when the tool reads or writes database state.
- For write tools, test scope denial and workspace-bound token isolation when the behavior is new.

## Docs To Update

Update both:

- `apps/docs/content/docs/mcp/tools-reference.mdx`
- `apps/site/lib/marketing/mcp-tools.ts`

Keep names, descriptions, and scopes aligned with `server.ts`.

## Red Flags

- Tool writes without `requireScope`.
- Tool writes workspace-owned data without owner/admin role check.
- Query accepts IDs without verifying the row belongs to `targetWorkspace.id`.
- Tool returns raw database errors to users.
- Docs or marketing list no longer matches registered tools.
- Integration tests silently skip when `RUN_INTEGRATION_TESTS=1`.
