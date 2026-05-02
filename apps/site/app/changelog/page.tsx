import type { Metadata } from "next";

import { ChangelogPlaceholder } from "@/components/marketing/changelog-placeholder";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Partha release notes — automated changelog generation is on the roadmap.",
};

export default function ChangelogPage() {
  return (
    <div className="px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-10">
        <header className="space-y-4">
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
            Changelog
          </p>
          <h1 className="text-foreground text-4xl font-semibold tracking-tight">Release cadence</h1>
          <p className="text-muted-foreground text-lg">
            We&apos;re staging semantic releases soon. Until automation lands, this page highlights major
            themes — detailed entries will mirror Git tags.
          </p>
        </header>
        <ChangelogPlaceholder />
      </div>
    </div>
  );
}
