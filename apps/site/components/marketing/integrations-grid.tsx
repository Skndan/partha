import Link from "next/link";

import { Badge } from "@workspace/ui/components/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";

type Integration = {
  name: string;
  body: string;
  status: "Available" | "Planned";
};

const ITEMS: Integration[] = [
  {
    name: "GitHub",
    body: "Repo provisioning, commit linkage, PR automation, changelog synthesis.",
    status: "Planned",
  },
  {
    name: "Payments",
    body: "Stripe & Razorpay flows for subscriptions, invoices, and webhook routing.",
    status: "Planned",
  },
  {
    name: "Analytics",
    body: "Product telemetry with opinionated dashboards for activation & retention.",
    status: "Planned",
  },
  {
    name: "Marketing channels",
    body: "Transactional and lifecycle messaging via modern ESPs.",
    status: "Planned",
  },
  {
    name: "Neon / Postgres",
    body: "Managed relational core — future paths for per-project isolation.",
    status: "Planned",
  },
  {
    name: "Vercel & cloud deploy",
    body: "Promotion-aware hooks so environments mirror workspace milestones.",
    status: "Planned",
  },
];

export function IntegrationsGrid() {
  return (
    <section className="bg-background px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-foreground text-3xl font-semibold tracking-tight">
              Integrations on the horizon
            </h2>
            <p className="text-muted-foreground text-lg">
              Today Partha focuses on collaboration primitives and MCP. Next we knit together the
              systems SaaS operators already depend on.
            </p>
          </div>
          <Link
            href="/integrations"
            className="text-primary text-sm font-medium hover:underline"
          >
            View integration roadmap →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((item) => (
            <Card key={item.name} className="border-border">
              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                <div className="space-y-2">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <CardDescription>{item.body}</CardDescription>
                </div>
                <Badge variant={item.status === "Available" ? "default" : "secondary"}>
                  {item.status}
                </Badge>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
