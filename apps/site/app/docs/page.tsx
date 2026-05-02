import type { Metadata } from "next";

import { env } from "@/env";
import { DOCS_SECTIONS } from "@/lib/marketing/docs-index";
import { githubDocsHref } from "@/lib/marketing/docs-links";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Index of Partha markdown documentation — view in-repo or on GitHub when NEXT_PUBLIC_GITHUB_DOCS_BASE is set.",
};

export default function DocsLandingPage() {
  const hasGithub = Boolean(env.NEXT_PUBLIC_GITHUB_DOCS_BASE);

  return (
    <div className="px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-10">
        <header className="space-y-4">
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
            Documentation
          </p>
          <h1 className="text-foreground text-4xl font-semibold tracking-tight">
            Markdown docs live in <code className="bg-muted rounded px-1.5 py-0.5 text-xl">docs/</code>
          </h1>
          <p className="text-muted-foreground text-lg">
            Partha ships docs as plain Markdown so they stay diff-friendly next to the product. Open files in
            your editor, or set{" "}
            <code className="bg-muted rounded px-1 py-0.5 text-sm">
              NEXT_PUBLIC_GITHUB_DOCS_BASE
            </code>{" "}
            (for example{" "}
            <code className="bg-muted rounded px-1 py-0.5 text-sm">
              https://github.com/org/repo/blob/main
            </code>
            ) to enable GitHub links below.
          </p>
          {!hasGithub ? (
            <p className="border-border bg-muted/40 text-muted-foreground rounded-lg border p-4 text-sm">
              GitHub deep links are disabled until <code>NEXT_PUBLIC_GITHUB_DOCS_BASE</code> is configured —
              local paths are still shown for each entry.
            </p>
          ) : null}
        </header>

        <div className="space-y-10">
          {DOCS_SECTIONS.map((section) => (
            <section key={section.title} className="space-y-4">
              <h2 className="text-foreground text-xl font-semibold">{section.title}</h2>
              <ul className="border-border divide-border divide-y rounded-lg border">
                {section.items.map((item) => {
                  const href = githubDocsHref(item.path);
                  return (
                    <li key={item.path} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-foreground font-medium">{item.label}</span>
                      <div className="flex flex-wrap items-center gap-3">
                        <code className="text-muted-foreground text-xs">{item.path}</code>
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary text-sm font-medium hover:underline"
                          >
                            View on GitHub
                          </a>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
