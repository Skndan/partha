import { env } from "@/env";

export function githubRepoHref(): string | null {
  return env.NEXT_PUBLIC_GITHUB_REPO_URL?.replace(/\/$/, "") ?? null;
}
