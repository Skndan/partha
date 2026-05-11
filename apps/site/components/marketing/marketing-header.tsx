import Link from "next/link";

import { Button } from "@workspace/ui/components/button";
import { ModeToggle } from "@workspace/ui/components/mode-toggle";
import { MarketingMobileNav } from "@/components/marketing/marketing-mobile-nav";
import { MarketingNavLinksDesktop } from "@/components/marketing/marketing-nav-links";
import { cn } from "@/lib/utils";
import { coreAppUrl } from "@/lib/core-app-url";
import { AuthBrandLogo } from "../auth-brand-logo";

export function MarketingHeader({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50 border-b border-border backdrop-blur",
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6">
        {/* <Link
          href="/"
          className="text-foreground shrink-0 text-xl font-semibold tracking-tight sm:text-[1.35rem]"
        >
          Partha
        </Link> */}
        <AuthBrandLogo />
        <MarketingNavLinksDesktop className="hidden items-center gap-6 md:flex" />

        <div className="flex items-center gap-2">
          <MarketingMobileNav />
          <ModeToggle />
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
            <Link href={coreAppUrl("/login")}>Login</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={coreAppUrl("/signup")}>Signup</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
