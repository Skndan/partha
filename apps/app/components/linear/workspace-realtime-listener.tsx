"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function WorkspaceRealtimeListener({ slug }: { slug: string }) {
  const router = useRouter();

  useEffect(() => {
    const source = new EventSource(`/api/workspaces/${slug}/events`);

    const handler = (event: MessageEvent<string>) => {
      try {
        const data = JSON.parse(event.data) as { type?: string };
        if (data.type && data.type !== "ping") {
          toast.message(`Live update: ${data.type.replaceAll("_", " ")}`);
        }
        router.refresh();
      } catch {
        router.refresh();
      }
    };

    source.addEventListener("issue_created", handler);
    source.addEventListener("issue_updated", handler);
    source.addEventListener("issue_comment_added", handler);
    source.addEventListener("issue_relation_added", handler);
    source.addEventListener("workspace_invite_created", handler);
    source.addEventListener("workspace_invite_accepted", handler);

    return () => {
      source.close();
    };
  }, [router, slug]);

  return null;
}
