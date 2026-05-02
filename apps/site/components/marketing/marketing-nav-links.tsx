import Link from "next/link";

export const MARKETING_NAV_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/mcp", label: "MCP" },
  { href: "/integrations", label: "Integrations" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
  { href: "/changelog", label: "Changelog" },
] as const;

export function MarketingNavLinksDesktop({
  className,
}: {
  className?: string;
}) {
  return (
    <nav className={className}>
      {MARKETING_NAV_LINKS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
