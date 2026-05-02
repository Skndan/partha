export type FeatureStatus = "Available" | "In progress" | "Planned";

export type FeatureRow = {
  name: string;
  detail: string;
  status: FeatureStatus;
};

export type FeaturePillar = {
  pillar: string;
  summary: string;
  rows: FeatureRow[];
};

export const FEATURE_MATRIX: FeaturePillar[] = [
  {
    pillar: "Plan",
    summary: "Structure work before it touches production systems.",
    rows: [
      {
        name: "Workspace onboarding",
        detail: "Create a workspace, invite members, accept invites.",
        status: "Available",
      },
      {
        name: "Teams & pods",
        detail: "Organize delivery units with keys, descriptions, and membership.",
        status: "Available",
      },
      {
        name: "Projects & milestones",
        detail: "Scope releases with statuses, target dates, and drill-down views.",
        status: "Available",
      },
      {
        name: "GitHub-backed planning",
        detail: "Automatic repo creation & branch linkage per project.",
        status: "Planned",
      },
      {
        name: "Provisioned databases",
        detail: "Spin Neon/Postgres instances when a project graduates phases.",
        status: "Planned",
      },
    ],
  },
  {
    pillar: "Analyze",
    summary: "Understand flow, ageing, and operational drag.",
    rows: [
      {
        name: "Workspace dashboard",
        detail: "Aggregate counts for teams, projects, and issues.",
        status: "Available",
      },
      {
        name: "Issue ageing signals",
        detail: "Marketing hero showcases ageing visualization — in-app analytics coming.",
        status: "In progress",
      },
      {
        name: "Product analytics",
        detail: "Deep funnel metrics via PostHog/Plausible wiring.",
        status: "Planned",
      },
      {
        name: "Executive summaries",
        detail: "Automated weekly digest across workspaces.",
        status: "Planned",
      },
    ],
  },
  {
    pillar: "Reach",
    summary: "Align humans and agents around one operating narrative.",
    rows: [
      {
        name: "Workspace members",
        detail: "Roles for owners/admins/members with invites.",
        status: "Available",
      },
      {
        name: "Notifications",
        detail: "User notifications tied to workspace activity.",
        status: "Available",
      },
      {
        name: "Marketing lifecycle hooks",
        detail: "ESP integrations for announcements & lifecycle campaigns.",
        status: "Planned",
      },
    ],
  },
  {
    pillar: "Track",
    summary: "Keep execution honest from idea to acceptance.",
    rows: [
      {
        name: "Issues",
        detail: "Statuses, priorities, labels, relations, comments, sub-issues.",
        status: "Available",
      },
      {
        name: "Activity timeline",
        detail: "Issue-level activity + workspace SSE listener.",
        status: "Available",
      },
      {
        name: "Commit ↔ issue linking",
        detail: "Trace commits and PRs to delivery artifacts.",
        status: "Planned",
      },
      {
        name: "Auto changelog",
        detail: "Generate changelog drafts from merged work.",
        status: "Planned",
      },
    ],
  },
  {
    pillar: "Harness",
    summary: "Put AI copilots to work safely.",
    rows: [
      {
        name: "MCP OAuth server",
        detail: "Hosted MCP with PKCE and scoped tokens.",
        status: "Available",
      },
      {
        name: "Workspace-aware tools",
        detail: "CRUD surfaces for teams, projects, milestones, issues.",
        status: "Available",
      },
      {
        name: "Policy bundles",
        detail: "Fine-grained tool allow lists per workspace tier.",
        status: "Planned",
      },
    ],
  },
  {
    pillar: "Accelerate",
    summary: "Automate glue across SaaS motion.",
    rows: [
      {
        name: "Payments",
        detail: "Stripe/Razorpay subscriptions & invoicing.",
        status: "Planned",
      },
      {
        name: "Deploy integrations",
        detail: "Vercel / cloud promotion hooks tied to milestones.",
        status: "Planned",
      },
      {
        name: "One-click SaaS bootstrap",
        detail: "Project templates provisioning infra & integrations.",
        status: "Planned",
      },
    ],
  },
];
