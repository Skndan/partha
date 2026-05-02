"use client";

import { toast } from "sonner";

export type PatchIssueOptions = {
  /** When true, skip success toast (e.g. autosave). Errors always toast. */
  silentSuccess?: boolean;
};

/** Coalesce concurrent PATCH calls with identical slug, issueId, and JSON body to one network request. */
const pendingByKey = new Map<string, Promise<boolean>>();

function pendingKey(
  slug: string,
  issueId: string,
  body: Record<string, unknown>,
  silentSuccess: boolean | undefined,
): string {
  return `${slug}\0${issueId}\0${silentSuccess ? "1" : "0"}\0${JSON.stringify(body)}`;
}

export async function patchIssue(
  slug: string,
  issueId: string,
  body: Record<string, unknown>,
  options?: PatchIssueOptions,
): Promise<boolean> {
  const key = pendingKey(slug, issueId, body, options?.silentSuccess);
  const existing = pendingByKey.get(key);
  if (existing) {
    return existing;
  }

  const promise = (async (): Promise<boolean> => {
    const res = await fetch(`/api/workspaces/${slug}/issues/${issueId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let message = "Unable to update issue";
      try {
        const err = (await res.json()) as { error?: unknown };
        if (typeof err.error === "string") {
          message = err.error;
        } else if (err.error && typeof err.error === "object") {
          const flat = err.error as Record<string, string[] | undefined>;
          const first = Object.values(flat).find((v) => v?.length)?.[0];
          if (first) message = first;
        }
      } catch {
        /* ignore */
      }
      toast.error(message);
      return false;
    }

    if (!options?.silentSuccess) {
      toast.success("Issue updated");
    }

    return true;
  })();

  pendingByKey.set(key, promise);

  try {
    return await promise;
  } finally {
    pendingByKey.delete(key);
  }
}
