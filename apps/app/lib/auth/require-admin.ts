import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";

export async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return { error: "Unauthorized" as const, status: 401 as const };
  }

  // BetterAuth's `admin()` plugin may populate `session.user.role`, but we
  // should treat it case-insensitively and fail closed if it's missing.
  const role = (session.user as { role?: unknown }).role;
  if (typeof role !== "string" || role.toLowerCase() !== "admin") {
    return { error: "Forbidden" as const, status: 403 as const };
  }
  return { session };
}
