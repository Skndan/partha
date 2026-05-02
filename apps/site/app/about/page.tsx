import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@workspace/ui/components/button";
import { coreAppUrl } from "@/lib/core-app-url";

export const metadata: Metadata = {
  title: "About",
  description:
    "Partha — Plan. Analyze. Reach. Track. Harness. Accelerate. Mission and contact.",
};

export default function AboutPage() {
  return (
    <div className="px-4 py-14 sm:px-6">
      <article className="text-foreground mx-auto max-w-3xl space-y-8 leading-relaxed">
        <header className="space-y-4">
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
            About
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">Built for builders who ship SaaS</h1>
          <p className="text-muted-foreground text-lg">
            Partha is an acronym: <strong className="text-foreground">Plan. Analyze. Reach. Track. Harness. Accelerate.</strong>
          </p>
        </header>
        <p className="text-muted-foreground">
          Modern SaaS operators juggle roadmaps, infra, analytics, revenue motion, and AI copilots —
          usually across disconnected tools. Partha starts as a crisp delivery workspace with MCP so agents
          participate safely, then grows into the connective tissue across GitHub, payments, analytics,
          marketing channels, and automated releases.
        </p>
        <p className="text-muted-foreground">
          We bias toward transparency: docs call out what exists versus what is planned, and every integration
          ships with explicit governance hooks.
        </p>
        <div className="border-border bg-muted/40 flex flex-col gap-4 rounded-lg border p-6">
          <p className="text-foreground font-medium">Talk with us</p>
          <p className="text-muted-foreground text-sm">
            Add contact channels (email, calendar, Slack) when you go public — placeholder section until then.
          </p>
          <Button asChild variant="outline" className="w-fit">
            <Link href={coreAppUrl("/signup")}>Join the beta workspace</Link>
          </Button>
        </div>
      </article>
    </div>
  );
}
