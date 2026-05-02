/** Links from marketing (`apps/site`) to the core product (`apps/app`), port 4000 by default. */
export function coreAppUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!base) return normalized;
  return `${base}${normalized}`;
}
