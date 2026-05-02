"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import {
  IssueFormDialog,
  type IssueCreatePrefill,
} from "@/components/linear/issue-data-table/issue-form-dialog";
import type { IssueLabelOption, IssueOption } from "@/components/linear/issue-data-table/types";
import { Button } from "@workspace/ui/components/button";

type ChildIssue = { id: string; identifier: string; title: string };

export function IssueSubissuesSection({
  slug,
  childIssues,
  createPrefill,
  statuses,
  teams,
  projects,
  milestones,
  members,
  labels,
}: {
  slug: string;
  childIssues: ChildIssue[];
  createPrefill: IssueCreatePrefill;
  statuses: IssueOption[];
  teams: IssueOption[];
  projects: IssueOption[];
  milestones: IssueOption[];
  members: IssueOption[];
  labels: IssueLabelOption[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="rounded-lg border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/50 p-3 rounded-t-lg">
        <span className="text-sm font-medium">Sub-issues</span>
        <Button type="button" size="sm" variant="secondary" onClick={() => setDialogOpen(true)}>
          <PlusIcon className="mr-2 size-4" aria-hidden />
          Add sub-issue
        </Button>
      </div>
      <div className="divide-y p-0">
        {childIssues.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">No sub-issues yet.</p>
        ) : (
          childIssues.map((child) => (
            <Link
              key={child.id}
              href={`/${slug}/issues/${encodeURIComponent(child.id)}`}
              className="block px-3 py-2 text-sm hover:bg-muted/50"
            >
              <span className="font-medium text-muted-foreground">{child.identifier}</span>{" "}
              <span>{child.title}</span>
            </Link>
          ))
        )}
      </div>

      <IssueFormDialog
        slug={slug}
        open={dialogOpen}
        mode="create"
        createPrefill={createPrefill}
        onOpenChange={setDialogOpen}
        statuses={statuses}
        teams={teams}
        projects={projects}
        milestones={milestones}
        members={members}
        labels={labels}
      />
    </div>
  );
}
