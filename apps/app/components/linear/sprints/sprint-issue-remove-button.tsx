"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";

export function SprintIssueRemoveButton({
  slug,
  projectId,
  sprintId,
  issueId,
}: {
  slug: string;
  projectId: string;
  sprintId: string;
  issueId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <Button
      disabled={loading}
      onClick={() => {
        void (async () => {
          setLoading(true);
          try {
            const res = await fetch(
              `/api/workspaces/${encodeURIComponent(slug)}/projects/${encodeURIComponent(projectId)}/sprints/${encodeURIComponent(sprintId)}/issues/${encodeURIComponent(issueId)}`,
              { method: "DELETE" },
            );
            if (!res.ok) {
              toast.error("Unable to remove issue");
              return;
            }
            toast.success("Removed from sprint");
            router.refresh();
          } finally {
            setLoading(false);
          }
        })();
      }}
      size="sm"
      type="button"
      variant="ghost"
    >
      Remove
    </Button>
  );
}
