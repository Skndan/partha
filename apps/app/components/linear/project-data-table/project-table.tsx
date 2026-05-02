"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { PencilIcon } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { getProjectTableColumns } from "./project-table-columns";
import { type ProjectTableRow } from "./types";

const statusOptions = [
  { label: "Planned", value: "planned" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Archived", value: "archived" },
];

type TeamFilterOption = {
  label: string;
  value: string;
  count?: number;
};

export function ProjectTable({
  slug,
  projects,
  totalCount,
  teamFilterOptions,
  onEdit,
}: {
  slug: string;
  projects: ProjectTableRow[];
  totalCount: number;
  teamFilterOptions: TeamFilterOption[];
  onEdit: (row: ProjectTableRow) => void;
}) {
  return (
    <DataTable
      columns={getProjectTableColumns(slug)}
      data={projects}
      rowCount={totalCount}
      searchPlaceholder="Search projects by name, key, or id"
      defaultSort="name"
      defaultOrder="asc"
      filters={[
        { columnId: "status", title: "Status", options: statusOptions },
        { columnId: "teamId", title: "Team", options: teamFilterOptions },
      ]}
      renderRowActions={(row) => (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <DotsHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <PencilIcon className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    />
  );
}
