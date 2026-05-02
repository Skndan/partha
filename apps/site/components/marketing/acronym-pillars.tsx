import {
  Bolt,
  Compass,
  Gauge,
  Radar,
  Route,
  Telescope,
} from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";

const PILLARS = [
  {
    letter: "P",
    word: "Plan",
    icon: Compass,
    body: "Shape initiatives, milestones, and delivery lanes before code lands.",
  },
  {
    letter: "A",
    word: "Analyze",
    icon: Radar,
    body: "Surface ageing, risk, and throughput so decisions stay evidence-led.",
  },
  {
    letter: "R",
    word: "Reach",
    icon: Route,
    body: "Coordinate teams and stakeholders around one workspace narrative.",
  },
  {
    letter: "T",
    word: "Track",
    icon: Telescope,
    body: "Follow issues, states, and ownership without losing history.",
  },
  {
    letter: "H",
    word: "Harness",
    icon: Gauge,
    body: "Wire MCP clients so assistants draft updates inside your guardrails.",
  },
  {
    letter: "A",
    word: "Accelerate",
    icon: Bolt,
    body: "Automate connective tissue — repos, billing signals, analytics, and launches.",
  },
] as const;

export function AcronymPillars() {
  return (
    <section className="border-border bg-background border-y px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="max-w-2xl space-y-3">
          <h2 className="text-foreground text-3xl font-semibold tracking-tight">Partha means momentum</h2>
          <p className="text-muted-foreground text-lg">
            Six verbs anchor how we think about operating modern SaaS programs — from discovery to
            launch and iteration.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((pillar) => (
            <Card key={pillar.word} className="border-border">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <span className="bg-muted text-foreground flex size-10 shrink-0 items-center justify-center rounded-lg font-semibold">
                    {pillar.letter}
                  </span>
                  <pillar.icon className="text-muted-foreground mt-1 size-5" aria-hidden />
                </div>
                <CardTitle className="text-lg">{pillar.word}</CardTitle>
                <CardDescription>{pillar.body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
