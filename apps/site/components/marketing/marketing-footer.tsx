import Link from "next/link";

import { githubRepoHref } from "@/lib/marketing/docs-links";

export function MarketingFooter() {
  const repo = githubRepoHref();

  return (
    <footer className="border-border bg-muted/30 border-t">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <p className="text-foreground font-semibold">Product</p>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li>
                <Link href="/features" className="hover:text-foreground transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/integrations" className="hover:text-foreground transition-colors">
                  Integrations
                </Link>
              </li>
              <li>
                <Link href="/changelog" className="hover:text-foreground transition-colors">
                  Changelog
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <p className="text-foreground font-semibold">Developers</p>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li>
                <Link href="/mcp" className="hover:text-foreground transition-colors">
                  MCP
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-foreground transition-colors">
                  Documentation
                </Link>
              </li>
              {repo ? (
                <li>
                  <a
                    href={repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    GitHub
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
          <div className="space-y-3">
            <p className="text-foreground font-semibold">Company</p>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <p className="text-foreground font-semibold">Stay in the loop</p>
            <p className="text-muted-foreground text-sm">
              Product updates and MCP recipes — newsletter signup coming soon.
            </p>
          </div>
        </div>
        <div className="border-border text-muted-foreground mt-10 flex flex-col gap-2 border-t pt-8 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Partha. Plan. Analyze. Reach. Track. Harness. Accelerate.</p>
          <p className="text-xs">Legal pages — add privacy & terms when you ship publicly.</p>
        </div>
      </div>
    </footer>
  );
}
