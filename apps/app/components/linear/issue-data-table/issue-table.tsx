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
import { getIssueTableColumns } from "./issue-table-columns";
import { type IssueTableRow } from "./types";

const priorityOptions = [
  { label: "No priority", value: "none" },
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" },
];

export function IssueTable({
  slug,
  issues,
  totalCount,
  statusFilterOptions,
  projectFilterOptions,
  milestoneFilterOptions,
  onEdit,
}: {
  slug: string;
  issues: IssueTableRow[];
  totalCount: number;
  statusFilterOptions: Array<{ label: string; value: string; count?: number }>;
  projectFilterOptions: Array<{ label: string; value: string; count?: number }>;
  milestoneFilterOptions: Array<{ label: string; value: string; count?: number }>;
  onEdit: (row: IssueTableRow) => void;
}) {
  return (
    <DataTable
      columns={getIssueTableColumns(slug)}
      data={issues}
      rowCount={totalCount}
      searchPlaceholder="Search issues by id or title"
      defaultSort="identifier"
      defaultOrder="asc"
      filters={[
        { columnId: "statusId", title: "Status", options: statusFilterOptions },
        { columnId: "projectId", title: "Project", options: projectFilterOptions },
        { columnId: "milestoneId", title: "Milestone", options: milestoneFilterOptions },
        { columnId: "priority", title: "Priority", options: priorityOptions },
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
