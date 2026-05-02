"use client";

import { useMemo, useState } from "react";
import { PlusIcon } from "lucide-react";

import { Heading } from "@workspace/ui/components/heading";
import { Button } from "@workspace/ui/components/button";
import { ProjectFormDialog } from "./project-form-dialog";
import { ProjectTable } from "./project-table";
import { type ProjectTableRow } from "./types";

type DialogState =
  | { open: false }
  | { open: true; mode: "create" }
  | { open: true; mode: "update"; project: ProjectTableRow };

export function ProjectPageContent({
  slug,
  title,
  description,
  addLabel,
  projects,
  totalCount,
  teams,
  teamFilterOptions,
  lockedTeamId,
}: {
  slug: string;
  title: string;
  description: string;
  addLabel: string;
  projects: ProjectTableRow[];
  totalCount: number;
  teams: Array<{ id: string; name: string }>;
  teamFilterOptions: Array<{ label: string; value: string; count?: number }>;
  lockedTeamId?: string;
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
            {addLabel}
          </Button>
        }
      />

      <ProjectTable
        slug={slug}
        projects={projects}
        totalCount={totalCount}
        teamFilterOptions={teamFilterOptions}
        onEdit={(project) => setDialogState({ open: true, mode: "update", project })}
      />

      <ProjectFormDialog
        slug={slug}
        open={dialogState.open}
        mode={dialogMode}
        project={dialogState.open && dialogState.mode === "update" ? dialogState.project : undefined}
        teams={teams}
        lockedTeamId={lockedTeamId}
        onOpenChange={(open) => {
          if (!open) {
            setDialogState({ open: false });
          }
        }}
      />
    </div>
  );
}
