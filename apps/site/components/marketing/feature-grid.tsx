import {
  Bell,
  Blocks,
  FolderKanban,
  LayoutDashboard,
  Radio,
  Tags,
  Users,
  Waypoints,
} from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";

const FEATURES = [
  {
    title: "Workspaces",
    icon: LayoutDashboard,
    desc: "Isolate programs per company or business unit with invites and roles.",
  },
  {
    title: "Teams",
    icon: Users,
    desc: "Ship with pods that own queues, rituals, and accountability.",
  },
  {
    title: "Projects",
    icon: FolderKanban,
    desc: "Bucket scopes with statuses, targets, and roadmap-ready summaries.",
  },
  {
    title: "Milestones",
    icon: Waypoints,
    desc: "Anchor releases and checkpoints across multiple streams.",
  },
  {
    title: "Issues",
    icon: Tags,
    desc: "Linear-grade detail — priorities, labels, relations, comments, sub-issues.",
  },
  {
    title: "Realtime updates",
    icon: Radio,
    desc: "Workspace listeners keep tables warm without manual refreshes.",
  },
  {
    title: "Notifications",
    icon: Bell,
    desc: "Stay aligned when assignments, mentions, or milestones shift.",
  },
  {
    title: "Composable UI",
    icon: Blocks,
    desc: "Built with shadcn primitives so your workspace chrome stays accessible.",
  },
] as const;

export function FeatureGrid() {
  return (
    <section className="bg-background px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="max-w-2xl space-y-3">
          <h2 className="text-foreground text-3xl font-semibold tracking-tight">Everything shipping today</h2>
          <p className="text-muted-foreground text-lg">
            Partha already powers delivery workflows for builders who want clarity without enterprise
            bloat.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Card key={f.title} className="border-border">
              <CardHeader>
                <f.icon className="text-muted-foreground mb-2 size-6" aria-hidden />
                <CardTitle className="text-base">{f.title}</CardTitle>
                <CardDescription>{f.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
