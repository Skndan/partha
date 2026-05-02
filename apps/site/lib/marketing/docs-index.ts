export type DocsLinkItem = {
  label: string;
  /** Path relative to repository root, used with NEXT_PUBLIC_GITHUB_DOCS_BASE */
  path: string;
};

export type DocsSection = {
  title: string;
  items: DocsLinkItem[];
};

export const DOCS_SECTIONS: DocsSection[] = [
  {
    title: "Start here",
    items: [
      { label: "Documentation index", path: "docs/README.md" },
      { label: "Getting started", path: "docs/getting-started.md" },
      { label: "Roadmap", path: "docs/roadmap.md" },
      { label: "Contributing", path: "docs/contributing.md" },
      { label: "Security", path: "docs/security.md" },
      { label: "Deploy", path: "docs/deploy.md" },
    ],
  },
  {
    title: "Concepts",
    items: [
      { label: "Overview", path: "docs/concepts/overview.md" },
      { label: "Workspaces", path: "docs/concepts/workspaces.md" },
      { label: "Teams", path: "docs/concepts/teams.md" },
      { label: "Projects", path: "docs/concepts/projects.md" },
      { label: "Milestones", path: "docs/concepts/milestones.md" },
      { label: "Issues", path: "docs/concepts/issues.md" },
      { label: "Members & invites", path: "docs/concepts/members-and-invites.md" },
      { label: "Notifications & activity", path: "docs/concepts/notifications-and-activity.md" },
      { label: "Realtime", path: "docs/concepts/realtime.md" },
    ],
  },
  {
    title: "MCP",
    items: [
      { label: "MCP overview", path: "docs/mcp/index.md" },
      { label: "OAuth", path: "docs/mcp/oauth.md" },
      { label: "Scopes", path: "docs/mcp/scopes.md" },
      { label: "Tools reference", path: "docs/mcp/tools-reference.md" },
      { label: "Pagination", path: "docs/mcp/pagination.md" },
      { label: "Dev tokens", path: "docs/mcp/dev-tokens.md" },
      { label: "Client: Cursor", path: "docs/mcp/clients/cursor.md" },
      { label: "Client: Claude", path: "docs/mcp/clients/claude.md" },
      { label: "Client: OpenClaw", path: "docs/mcp/clients/openclaw.md" },
      { label: "Client: stdio", path: "docs/mcp/clients/stdio.md" },
    ],
  },
  {
    title: "Integrations (planned)",
    items: [
      { label: "GitHub", path: "docs/integrations/github.md" },
      { label: "Payments", path: "docs/integrations/payments.md" },
      { label: "Analytics", path: "docs/integrations/analytics.md" },
      { label: "Marketing", path: "docs/integrations/marketing.md" },
      { label: "Databases", path: "docs/integrations/databases.md" },
      { label: "Deployments", path: "docs/integrations/deployments.md" },
    ],
  },
  {
    title: "Automations (planned)",
    items: [
      { label: "Auto changelog", path: "docs/automations/auto-changelog.md" },
      { label: "Commit tracking", path: "docs/automations/commit-tracking.md" },
      { label: "SaaS bootstrap", path: "docs/automations/saas-bootstrap.md" },
    ],
  },
];
