import type { Metadata } from "next";

import { CtaBanner } from "@/components/marketing/cta-banner";
import { FeatureMatrixSection } from "@/components/marketing/feature-matrix-section";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Partha capabilities mapped to Plan, Analyze, Reach, Track, Harness, Accelerate — current vs planned.",
};

export default function FeaturesPage() {
  return (
    <div className="px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-12">
        <header className="max-w-2xl space-y-4">
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
            Features
          </p>
          <h1 className="text-foreground text-4xl font-semibold tracking-tight">
            Roadmap-aware capability matrix
          </h1>
          <p className="text-muted-foreground text-lg">
            Every capability lists whether it ships today, is actively shaping up, or is planned — no
            surprise vapourware.
          </p>
        </header>
        <FeatureMatrixSection />
      </div>
      <CtaBanner />
    </div>
  );
}
