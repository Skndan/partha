"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Label } from "@workspace/ui/components/label";
import { ScrollArea } from "@workspace/ui/components/scroll-area";

type WorkspaceIssueListItem = {
  id: string;
  identifier: string;
  title: string;
  projectId: string | null;
};

export function AddSprintIssuesDialog({
  slug,
  projectId,
  sprintId,
  sprintIssueIds,
}: {
  slug: string;
  projectId: string;
  sprintId: string;
  sprintIssueIds: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [issues, setIssues] = useState<WorkspaceIssueListItem[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const inSprint = useMemo(() => new Set(sprintIssueIds), [sprintIssueIds]);

  const loadIssues = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch(`/api/workspaces/${encodeURIComponent(slug)}/issues`);
      if (!res.ok) {
        toast.error("Unable to load issues");
        return;
      }
      const body = (await res.json()) as { issues: WorkspaceIssueListItem[] };
      const filtered = body.issues.filter(
        (row) => row.projectId === projectId && !inSprint.has(row.id),
      );
      setIssues(filtered);
      setSelected({});
    } finally {
      setFetching(false);
    }
  }, [slug, projectId, inSprint]);

  useEffect(() => {
    if (!open) return;
    void loadIssues();
  }, [open, loadIssues]);

  async function handleAdd() {
    const issueIds = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([id]) => id);
    if (!issueIds.length) {
      toast.error("Select at least one issue");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/workspaces/${encodeURIComponent(slug)}/projects/${encodeURIComponent(projectId)}/sprints/${encodeURIComponent(sprintId)}/issues`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ issueIds }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(typeof body?.error === "string" ? body.error : "Unable to add issues");
        return;
      }
      toast.success("Issues added to sprint");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          Add issues
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add issues to sprint</DialogTitle>
        </DialogHeader>
        {fetching ? (
          <p className="text-muted-foreground text-sm">Loading issues…</p>
        ) : issues.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No eligible issues. Issues must belong to this project and not already be on a sprint.
          </p>
        ) : (
          <ScrollArea className="max-h-[50vh] pr-3">
            <ul className="space-y-3">
              {issues.map((issue) => (
                <li className="flex items-start gap-3" key={issue.id}>
                  <Checkbox
                    checked={Boolean(selected[issue.id])}
                    id={`add-sprint-issue-${issue.id}`}
                    onCheckedChange={(checked) =>
                      setSelected((prev) => ({
                        ...prev,
                        [issue.id]: checked === true,
                      }))
                    }
                  />
                  <Label
                    className="cursor-pointer font-normal leading-snug"
                    htmlFor={`add-sprint-issue-${issue.id}`}
                  >
                    <span className="font-mono text-muted-foreground text-xs">{issue.identifier}</span>
                    <span className="block">{issue.title}</span>
                  </Label>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
        <DialogFooter>
          <Button disabled={loading || fetching || issues.length === 0} onClick={() => void handleAdd()} type="button">
            Add selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
