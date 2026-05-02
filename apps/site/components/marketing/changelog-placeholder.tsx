import { Card, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";

const PLACEHOLDER_ENTRIES = [
  {
    version: "Now",
    title: "MCP OAuth & HTTP transport",
    body: "Shipped: OAuth code flow, metadata endpoints, and tool coverage across workspaces and delivery artifacts.",
  },
  {
    version: "Roadmap",
    title: "Automated changelog generation",
    body: "Upcoming: derive changelog entries from merged PRs, MCP actions, and milestone closures.",
  },
];

export function ChangelogPlaceholder() {
  return (
    <div className="relative space-y-6 border-l border-border pl-6">
      {PLACEHOLDER_ENTRIES.map((entry) => (
        <Card key={entry.title} className="border-border relative ml-0">
          <span className="bg-background ring-border absolute -left-[calc(1.5rem+5px)] top-6 size-2.5 rounded-full ring-2" />
          <CardHeader>
            <p className="text-muted-foreground text-xs font-medium uppercase">{entry.version}</p>
            <CardTitle className="text-lg">{entry.title}</CardTitle>
            <CardDescription>{entry.body}</CardDescription>
          </CardHeader>
        </Card>
      ))}
      <p className="text-muted-foreground text-sm">
        Detailed dated changelog entries will appear here once automated release notes ship; scope lives in{" "}
        <code className="bg-muted rounded px-1 py-0.5 text-xs">docs/roadmap.md</code>.
      </p>
    </div>
  );
}
