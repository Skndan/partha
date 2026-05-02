# MCP client: Cursor (HTTP)

Cursor supports MCP servers over HTTP with interactive OAuth.

## Config (`~/.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "partha-local": {
      "url": "http://localhost:3000/api/mcp"
    }
  }
}
```

Swap the URL for your deployed origin when not developing locally.

## Expected UX

1. Run Partha (`bun dev` or production URL).
2. Invoke any tool from the MCP server inside Cursor.
3. Cursor receives `401` + `WWW-Authenticate` challenge on first call.
4. Use Cursor’s **Authenticate** flow to log into Partha and approve scopes.
5. Cursor persists tokens and retries tool calls.

## Troubleshooting

- Confirm Partha origin matches JSON URL (port/protocol).
- Clear stale MCP credentials by removing/re-adding the server in Cursor.
- Ensure redirect URIs obey HTTPS / localhost rules described in [oauth.md](../oauth.md).
