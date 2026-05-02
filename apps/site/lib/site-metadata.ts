import type { Metadata } from "next";

function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:4001";
  return raw.replace(/\/$/, "");
}

export const siteMetadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  applicationName: "Partha",
  title: {
    default: "Partha — Plan. Analyze. Reach. Track. Harness. Accelerate.",
    template: "%s · Partha",
  },
  description:
    "Project management for SaaS builders: workspaces, teams, projects, issues, and MCP so AI assistants can work with your backlog alongside you.",
  keywords: [
    "Partha",
    "project management",
    "SaaS",
    "issues",
    "milestones",
    "workspace",
    "MCP",
    "Model Context Protocol",
    "Cursor",
    "Claude",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl(),
    siteName: "Partha",
    title: "Partha — Plan. Analyze. Reach. Track. Harness. Accelerate.",
    description:
      "Project management for SaaS builders with MCP integration for Cursor, Claude, and other AI clients.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "Partha — Plan. Analyze. Reach. Track. Harness. Accelerate.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Partha — Plan. Analyze. Reach. Track. Harness. Accelerate.",
    description:
      "Project management for SaaS builders with MCP integration for AI assistants.",
    images: ["/og-default.png"],
  },
};
