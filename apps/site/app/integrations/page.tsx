import type { Metadata } from "next";
import Link from "next/link";

import { docsHref } from "@/lib/marketing/docs-url";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";

export const metadata: Metadata = {
  title: "Integrations",
  description:
    "Planned integrations for GitHub, payments, analytics, marketing channels, databases, and deployments.",
};

const ROWS = [
  {
    name: "GitHub",
    body: "Create repos when projects spawn, mirror commits to issues, and draft change logs from merged history.",
    status: "Planned" as const,
    docPath: "integrations/github",
  },
  {
    name: "Stripe & Razorpay",
    body: "Unified billing primitives with webhook ingestion mapped to workspace milestones.",
    status: "Planned" as const,
    docPath: "integrations/payments",
  },
  {
    name: "Analytics",
    body: "Activation and retention telemetry with guardrailed event taxonomy.",
    status: "Planned" as const,
    docPath: "integrations/analytics",
  },
  {
    name: "Marketing & ESP",
    body: "Transactional + nurture journeys triggered by delivery milestones.",
    status: "Planned" as const,
    docPath: "integrations/marketing",
  },
  {
    name: "Databases",
    body: "Spin Neon / Postgres instances when initiatives graduate phases.",
    status: "Planned" as const,
    docPath: "integrations/databases",
  },
  {
    name: "Deployments",
    body: "Vercel and cloud promotion hooks tied to Partha milestones.",
    status: "Planned" as const,
    docPath: "integrations/deployments",
  },
];

export default function IntegrationsPage() {
  return (
    <div className="px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="max-w-2xl space-y-4">
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
            Integrations
          </p>
          <h1 className="text-foreground text-4xl font-semibold tracking-tight">
            Connect the SaaS stack you already run
          </h1>
          <p className="text-muted-foreground text-lg">
            Partha&apos;s near-term focus stays collaboration + MCP. Everything below is documented as{" "}
            <Badge variant="outline">Planned</Badge> with intent — follow{" "}
            <Link href="/docs" className="text-primary font-medium hover:underline">
              Docs
            </Link>{" "}
            for evolving specs.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          {ROWS.map((row) => (
            <Card key={row.name} className="border-border">
              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                <div className="space-y-2">
                  <CardTitle>{row.name}</CardTitle>
                  <CardDescription>{row.body}</CardDescription>
                  <Link
                    href={docsHref(row.docPath)}
                    className="text-primary text-xs font-medium hover:underline"
                  >
                    Read spec
                  </Link>
                </div>
                <Badge variant="secondary">{row.status}</Badge>
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/docs">Browse integration specs</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/mcp">Wire MCP today</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
