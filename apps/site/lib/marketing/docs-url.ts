import { env } from "@/env";

const DEFAULT_DOCS_URL = "http://localhost:4002";

export function docsBaseUrl(): string {
  return (env.NEXT_PUBLIC_DOCS_URL ?? DEFAULT_DOCS_URL).replace(/\/$/, "");
}

/** Path under `/docs` without leading slash (e.g. `mcp/oauth`). */
export function docsHref(path = ""): string {
  const base = docsBaseUrl();
  const clean = path.replace(/^\//, "").replace(/^docs\//, "");
  return clean ? `${base}/docs/${clean}` : `${base}/docs`;
}
