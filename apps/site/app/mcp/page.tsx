import type { Metadata } from "next";
import Link from "next/link";

import { McpToolsTable } from "@/components/marketing/mcp-tools-table";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { coreAppUrl } from "@/lib/core-app-url";

export const metadata: Metadata = {
  title: "MCP",
  description:
    "Partha Model Context Protocol server — OAuth, scopes, tools, and client setup for Cursor, Claude, OpenClaw.",
};

const CURSOR_SNIPPET = `{
  "mcpServers": {
    "partha": {
      "url": "https://your-domain.com/api/mcp"
    }
  }
}`;

const CLAUDE_SNIPPET = `{
  "mcpServers": {
    "partha": {
      "url": "https://your-domain.com/api/mcp"
    }
  }
}`;

const OPENCLAW_SNIPPET = `# Configure your OpenClaw MCP entry with the Partha HTTP endpoint.
# Exact config format follows your OpenClaw version — point transports at:
https://your-domain.com/api/mcp`;

export default function McpMarketingPage() {
  return (
    <div className="px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-14">
        <header className="max-w-3xl space-y-4">
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">MCP</p>
          <h1 className="text-foreground text-4xl font-semibold tracking-tight">
            Bring AI assistants into your delivery rails
          </h1>
          <p className="text-muted-foreground text-lg">
            Partha exposes a typed MCP surface over your workspaces. OAuth keeps tokens scoped, HTTP keeps hosted
            setups simple, and stdio keeps local automation predictable.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/docs">Read MCP docs</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={coreAppUrl("/signup")}>Create a workspace</Link>
            </Button>
          </div>
        </header>

        <section className="space-y-4">
          <h2 className="text-foreground text-2xl font-semibold tracking-tight">OAuth flow (summary)</h2>
          <ol className="text-muted-foreground list-inside list-decimal space-y-2 text-sm leading-relaxed">
            <li>
              Client redirects the user to <code className="bg-muted rounded px-1 py-0.5">GET /api/mcp/oauth/authorize</code>{" "}
              with PKCE S256 parameters plus optional <code className="bg-muted rounded px-1">workspace_slug</code>.
            </li>
            <li>
              After session login, the user returns through Partha and lands on the registered{" "}
              <code className="bg-muted rounded px-1 py-0.5">redirect_uri</code> with an authorization{" "}
              <code className="bg-muted rounded px-1 py-0.5">code</code>.
            </li>
            <li>
              Client exchanges the code at{" "}
              <code className="bg-muted rounded px-1 py-0.5">POST /api/mcp/oauth/token</code>.
            </li>
            <li>
              Subsequent MCP calls include{" "}
              <code className="bg-muted rounded px-1 py-0.5">Authorization: Bearer …</code> against{" "}
              <code className="bg-muted rounded px-1 py-0.5">/api/mcp</code>.
            </li>
          </ol>
          <p className="text-muted-foreground text-sm">
            Deep dives: <code className="bg-muted rounded px-1">docs/mcp/oauth.md</code> and{" "}
            <code className="bg-muted rounded px-1">docs/mcp/scopes.md</code>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-foreground text-2xl font-semibold tracking-tight">Registered tools</h2>
          <p className="text-muted-foreground text-sm">
            Mirrors <code className="bg-muted rounded px-1">lib/mcp/server.ts</code> — refresh when adding tools.
          </p>
          <McpToolsTable />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3">
            <h3 className="text-foreground font-semibold">Cursor</h3>
            <p className="text-muted-foreground text-sm">
              Use HTTP transport for interactive OAuth. After an MCP tool call, Cursor prompts you to authenticate.
            </p>
            <Card className="border-border overflow-hidden">
              <CardContent className="p-0">
                <pre className="text-foreground overflow-x-auto p-4 text-xs leading-relaxed">
                  <code>{CURSOR_SNIPPET}</code>
                </pre>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-3">
            <h3 className="text-foreground font-semibold">Claude Desktop</h3>
            <p className="text-muted-foreground text-sm">
              Add Partha to your MCP server list using the same HTTP endpoint pattern your build supports.
            </p>
            <Card className="border-border overflow-hidden">
              <CardContent className="p-0">
                <pre className="text-foreground overflow-x-auto p-4 text-xs leading-relaxed">
                  <code>{CLAUDE_SNIPPET}</code>
                </pre>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-3">
            <h3 className="text-foreground font-semibold">OpenClaw</h3>
            <p className="text-muted-foreground text-sm">
              Wire Partha as an HTTP MCP backend; follow OpenClaw&apos;s transport docs for auth bridging.
            </p>
            <Card className="border-border overflow-hidden">
              <CardContent className="p-0">
                <pre className="text-foreground overflow-x-auto p-4 text-xs leading-relaxed whitespace-pre-wrap">
                  <code>{OPENCLAW_SNIPPET}</code>
                </pre>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="border-border bg-muted/30 space-y-4 rounded-xl border p-6">
          <h2 className="text-foreground text-xl font-semibold">Stdio & dev tokens</h2>
          <p className="text-muted-foreground text-sm">
            Local workflows can mint tokens via <code className="bg-muted rounded px-1">bun run mcp:token</code> or the{" "}
            <code className="bg-muted rounded px-1">/dev/mcp-token</code> UI (development only). See{" "}
            <code className="bg-muted rounded px-1">docs/mcp/dev-tokens.md</code> and{" "}
            <code className="bg-muted rounded px-1">docs/mcp/clients/stdio.md</code>.
          </p>
        </section>
      </div>
    </div>
  );
}
