import type { Metadata } from "next";

import { PricingTiers } from "@/components/marketing/pricing-tiers";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Placeholder tiers for Partha — pricing finalized closer to general availability.",
};

const FAQ = [
  {
    q: "Is Partha self-hosted?",
    a: "You can run it yourself today — see docs/getting-started.md and docs/deploy.md. Managed hosting details arrive with GA.",
  },
  {
    q: "How does MCP billing work?",
    a: "Usage-based metering for hosted MCP is still being designed with early partners.",
  },
  {
    q: "Can we get enterprise SSO?",
    a: "On the roadmap — tracked alongside governance requirements in docs/roadmap.md.",
  },
];

export default function PricingPage() {
  return (
    <div className="px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-12">
        <header className="mx-auto max-w-2xl space-y-4 text-center">
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
            Pricing
          </p>
          <h1 className="text-foreground text-4xl font-semibold tracking-tight">
            Simple tiers that scale with operators
          </h1>
          <p className="text-muted-foreground text-lg">
            We&apos;re intentionally holding numbers until bundles stabilize — reach out if you want to
            partner on packaging.
          </p>
        </header>
        <PricingTiers />
        <div className="mx-auto max-w-2xl">
          <h2 className="text-foreground mb-4 text-xl font-semibold">FAQ</h2>
          <Accordion type="single" collapsible className="w-full">
            {FAQ.map((item, i) => (
              <AccordionItem key={item.q} value={`item-${i}`}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
