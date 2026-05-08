"use client";

import { useMemo, useState } from "react";
import { CircleDotDashedIcon, PlusIcon } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { Heading } from "@workspace/ui/components/heading";
import { IssueFormDialog } from "./issue-form-dialog";
import { IssueTable } from "./issue-table";
import {
  type IssueLabelOption,
  type IssueOption,
  type IssueTableRow,
} from "./types";

type DialogState =
  | { open: false }
  | { open: true; mode: "create" }
  | { open: true; mode: "update"; issue: IssueTableRow };

export function IssuePageContent({
  slug,
  title,
  description,
  issues,
  totalCount,
  statuses,
  teams,
  projects,
  milestones,
  members,
  labels,
  statusFilterOptions,
  lockedTeamId,
  lockedProjectId,
}: {
  slug: string;
  title: string;
  description: string;
  issues: IssueTableRow[];
  totalCount: number;
  statuses: IssueOption[];
  teams: IssueOption[];
  projects: IssueOption[];
  milestones: IssueOption[];
  members: IssueOption[];
  labels: IssueLabelOption[];
  statusFilterOptions: Array<{ label: string; value: string; count?: number }>;
  lockedTeamId?: string;
  lockedProjectId?: string;
}) {
  const [dialogState, setDialogState] = useState<DialogState>({ open: false });
  const dialogMode = useMemo<"create" | "update">(
    () => (dialogState.open ? dialogState.mode : "create"),
    [dialogState],
  );

  return (
    <div className="space-y-6">
      <Heading
        title={title}
        description={description}
        action={
          <Button onClick={() => setDialogState({ open: true, mode: "create" })}>
            <PlusIcon className="mr-2 size-4" />
            Add issue
          </Button>
        }
      />

      {issues.length > 0 ? (
        <IssueTable
          slug={slug}
          issues={issues}
          totalCount={totalCount}
          statusFilterOptions={statusFilterOptions}
          projectFilterOptions={projects.map((project) => ({ label: project.name, value: project.id }))}
          milestoneFilterOptions={milestones.map((milestone) => ({ label: milestone.name, value: milestone.id }))}
          onEdit={(issue) => setDialogState({ open: true, mode: "update", issue })}
        />
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CircleDotDashedIcon />
            </EmptyMedia>
            <EmptyTitle>No issues yet</EmptyTitle>
            <EmptyDescription>Create your first issue to start tracking work.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setDialogState({ open: true, mode: "create" })}>
              <PlusIcon className="mr-2 size-4" />
              Add issue
            </Button>
          </EmptyContent>
        </Empty>
      )}

      <IssueFormDialog
        slug={slug}
        open={dialogState.open}
        mode={dialogMode}
        issue={dialogState.open && dialogState.mode === "update" ? dialogState.issue : undefined}
        onOpenChange={(open) => {
          if (!open) {
            setDialogState({ open: false });
          }
        }}
        statuses={statuses}
        teams={teams}
        projects={projects}
        milestones={milestones}
        members={members}
        labels={labels}
        lockedTeamId={lockedTeamId}
        lockedProjectId={lockedProjectId}
      />
    </div>
  );
}
