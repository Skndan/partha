"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
import { MARKETING_NAV_LINKS } from "@/components/marketing/marketing-nav-links";

export function MarketingMobileNav() {
  const links = MARKETING_NAV_LINKS;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(100vw,20rem)]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-3">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-foreground hover:text-primary py-2 text-base font-medium"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/about"
            className="text-foreground hover:text-primary py-2 text-base font-medium"
          >
            About
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
