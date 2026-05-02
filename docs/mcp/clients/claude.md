# MCP client: Claude Desktop

Claude Desktop MCP configurations vary by release; the stable concept is to register Partha as an HTTP MCP endpoint alongside other servers.

## Pattern

```json
{
  "mcpServers": {
    "partha": {
      "url": "https://your-domain.com/api/mcp"
    }
  }
}
```

Consult Anthropic’s latest Claude Desktop documentation for the precise config file location and schema on your OS.

## Authentication

Use Partha’s OAuth flow ([oauth.md](../oauth.md)). After Claude triggers an MCP call, complete login/consent in the browser window Claude opens.

## Notes

- Keep scopes narrow (`mcp:read`, `workspace:read`, etc.) until automation requires writes.
- Workspace-bound tokens simplify multi-tenant setups.
