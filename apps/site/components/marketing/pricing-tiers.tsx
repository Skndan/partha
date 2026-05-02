import Link from "next/link";

import { Button } from "@workspace/ui/components/button";
import { coreAppUrl } from "@/lib/core-app-url";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card";

type Tier = {
  name: string;
  blurb: string;
  bullets: string[];
  cta: string;
  emphasized?: boolean;
};

const TIERS: Tier[] = [
  {
    name: "Starter",
    blurb: "For founders validating motion with a single workspace.",
    bullets: ["Core PM primitives", "Members & invites", "MCP read/write scopes"],
    cta: "Start free",
  },
  {
    name: "Team",
    blurb: "For product/engineering pods coordinating multiple ships.",
    bullets: ["Everything in Starter", "Advanced routing (soon)", "Priority MCP quotas (soon)"],
    cta: "Join waitlist",
    emphasized: true,
  },
  {
    name: "Scale",
    blurb: "For orgs wiring GitHub, billing, analytics, and automation.",
    bullets: ["Dedicated success channel (planned)", "Org-wide governance (planned)", "Custom MCP policies (planned)"],
    cta: "Talk to us",
  },
];

export function PricingTiers({ showDisclaimer = true }: { showDisclaimer?: boolean }) {
  return (
    <div className="space-y-8">
      {showDisclaimer ? (
        <p className="text-muted-foreground text-center text-sm">
          Pricing will be finalized closer to GA — numbers here are intentionally omitted while we
          validate bundles with design partners.
        </p>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-3">
        {TIERS.map((tier) => (
          <Card
            key={tier.name}
            className={
              tier.emphasized
                ? "border-primary ring-ring/30 relative border-2 shadow-sm ring-2"
                : "border-border"
            }
          >
            <CardHeader>
              <CardTitle>{tier.name}</CardTitle>
              <CardDescription>{tier.blurb}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-muted-foreground space-y-2 text-sm">
                {tier.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="text-primary">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant={tier.emphasized ? "default" : "outline"}>
                <Link href={coreAppUrl("/signup")}>{tier.cta}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
