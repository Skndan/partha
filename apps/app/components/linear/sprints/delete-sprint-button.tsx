"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";

export function DeleteSprintButton({
  slug,
  projectId,
  sprintId,
}: {
  slug: string;
  projectId: string;
  sprintId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline">
          Delete sprint
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this sprint?</AlertDialogTitle>
          <AlertDialogDescription>
            Sprint issues will remain on the project; only sprint membership is removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <Button
            disabled={loading}
            onClick={() => {
              void (async () => {
                setLoading(true);
                try {
                  const res = await fetch(
                    `/api/workspaces/${encodeURIComponent(slug)}/projects/${encodeURIComponent(projectId)}/sprints/${encodeURIComponent(sprintId)}`,
                    { method: "DELETE" },
                  );
                  if (!res.ok) {
                    toast.error("Unable to delete sprint");
                    return;
                  }
                  toast.success("Sprint deleted");
                  router.push(`/${slug}/project/${projectId}/sprints`);
                  router.refresh();
                } finally {
                  setLoading(false);
                }
              })();
            }}
            variant="destructive"
          >
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
