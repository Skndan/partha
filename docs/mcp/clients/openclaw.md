# MCP client: OpenClaw

OpenClaw-compatible agents typically consume MCP servers via HTTP or stdio transports depending on runtime.

## HTTP transport

Point your OpenClaw MCP transport configuration at:

```text
https://your-domain.com/api/mcp
```

Follow OpenClaw’s documentation for:

- Where MCP servers are declared for your deployment mode.
- How OAuth/browser prompts are surfaced to end users.

## Stdio transport

If OpenClaw supports attaching external MCP processes, reuse Partha’s stdio bootstrap (`bun run mcp:stdio`) together with a minted token ([dev-tokens.md](../dev-tokens.md)).

## Operational guidance

- Prefer workspace-scoped tokens when multiple tenants share one integration host.
- Rotate tokens frequently for unattended bots.
