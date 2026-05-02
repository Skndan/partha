import { AcronymPillars } from "@/components/marketing/acronym-pillars";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { HeroStatusBoard } from "@/components/marketing/hero-status-board";
import { IntegrationsGrid } from "@/components/marketing/integrations-grid";
import { McpSection } from "@/components/marketing/mcp-section";

export default function MarketingHomePage() {
  return (
    <>
      <HeroStatusBoard />
      <AcronymPillars />
      <FeatureGrid />
      <McpSection />
      <IntegrationsGrid />
      <CtaBanner />
    </>
  );
}
