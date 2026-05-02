import { env } from "@/env";

/** Base URL for GitHub-rendered markdown (e.g. https://github.com/org/repo/blob/main). */
export function githubDocsHref(relativePathFromDocsRoot: string): string | null {
  const base = env.NEXT_PUBLIC_GITHUB_DOCS_BASE?.replace(/\/$/, "");
  if (!base) return null;
  const clean = relativePathFromDocsRoot.replace(/^\//, "");
  return `${base}/${clean}`;
}

export function githubRepoHref(): string | null {
  return env.NEXT_PUBLIC_GITHUB_REPO_URL?.replace(/\/$/, "") ?? null;
}
