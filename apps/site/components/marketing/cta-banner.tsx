import Link from "next/link";

import { Button } from "@workspace/ui/components/button";
import { coreAppUrl } from "@/lib/core-app-url";

export function CtaBanner() {
  return (
    <section className="border-border bg-muted/40 border-y px-4 py-16 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-xl border border-border bg-background p-8 shadow-sm sm:flex-row sm:items-center">
        <div className="space-y-2">
          <h2 className="text-foreground text-2xl font-semibold tracking-tight">
            Ready to orchestrate your next ship?
          </h2>
          <p className="text-muted-foreground max-w-xl text-sm sm:text-base">
            Spin up a workspace, invite your pod, and optionally wire MCP so assistants stay inside
            your delivery rails.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href={coreAppUrl("/signup")}>Start with Partha</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={coreAppUrl("/login")}>Sign in</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
