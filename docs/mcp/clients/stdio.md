# MCP client: stdio

Partha ships a stdio MCP server for local automation:

```bash
export MCP_ACCESS_TOKEN="mcp_at_..."
bun run mcp:stdio
```

Entry script: `scripts/mcp-stdio.ts`.

## Tokens

Mint tokens via:

- `bun run mcp:token ...` ([dev-tokens.md](../dev-tokens.md))
- `/dev/mcp-token` UI during development

Never reuse production user passwords — rely on OAuth access tokens or development minting flows only where guarded by `NODE_ENV`.

## When to use stdio

- CI bots with injected secrets (prefer narrowly scoped tokens).
- Local scripting environments without interactive OAuth browsers.

HTTP remains preferable for interactive assistants such as Cursor.
