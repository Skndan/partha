import Link from "next/link";

import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";

const snippet = `{
  "mcpServers": {
    "partha": {
      "url": "https://your-domain.com/api/mcp"
    }
  }
}`;

export function McpSection() {
  return (
    <section className="from-muted/30 to-background bg-gradient-to-b px-4 py-16 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-4">
          <h2 className="text-foreground text-3xl font-semibold tracking-tight">
            MCP-native project intelligence
          </h2>
          <p className="text-muted-foreground text-lg">
            Partha exposes a standards-based MCP server with OAuth so assistants in Cursor, Claude
            Desktop, OpenClaw, or custom agents can list workspaces, triage issues, and draft updates
            with human approvals still in your product.
          </p>
          <ul className="text-muted-foreground list-inside list-disc space-y-2 text-sm">
            <li>PKCE OAuth + scoped tokens (`mcp:read`, `mcp:write`, `workspace:*`)</li>
            <li>HTTP transport for hosted setups and stdio for local automation</li>
            <li>Tooling covers workspaces → teams → projects → milestones → issues</li>
          </ul>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/mcp">Explore MCP setup</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/docs">Read the docs</Link>
            </Button>
          </div>
        </div>
        <Card className="border-border overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-muted/50 text-muted-foreground border-border border-b px-4 py-2 text-xs font-medium">
              ~/.cursor/mcp.json
            </div>
            <pre className="text-foreground overflow-x-auto p-4 text-sm leading-relaxed">
              <code>{snippet}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
