"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/data-table";
import { type IssueTableRow } from "./types";
import { Status, StatusIndicator, StatusLabel } from "@/components/kibo-ui/status";

type PillStatusVariant = "online" | "offline" | "maintenance" | "degraded";

const getIssueStatusVariant = (statusName: string): PillStatusVariant => {
  const normalizedStatus = statusName.toLowerCase();

  if (normalizedStatus.includes("done") || normalizedStatus.includes("completed")) {
    return "online";
  }

  if (normalizedStatus.includes("cancel") || normalizedStatus.includes("blocked")) {
    return "offline";
  }

  if (
    normalizedStatus.includes("progress") ||
    normalizedStatus.includes("review") ||
    normalizedStatus.includes("test")
  ) {
    return "maintenance";
  }

  return "degraded";
};

const getPriorityVariant = (priority: IssueTableRow["priority"]): PillStatusVariant => {
  if (priority === "urgent" || priority === "high") {
    return "offline";
  }

  if (priority === "medium") {
    return "maintenance";
  }

  if (priority === "low") {
    return "degraded";
  }

  return "online";
};

export function getIssueTableColumns(slug: string): ColumnDef<IssueTableRow>[] {
  return [
    {
      accessorKey: "identifier",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Issue" />,
      cell: ({ row }) => (
        <Link
          className="font-medium underline-offset-4 hover:underline"
          href={`/${slug}/issues/${row.original.id}`}
        >
          {row.original.identifier}
        </Link>
      ),
    },
    {
      accessorKey: "title",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => (
        <Link
          className="font-medium underline-offset-4 hover:underline"
          href={`/${slug}/issues/${row.original.id}`}
        >
          {row.original.title}
        </Link>
      ),
    },
    {
      id: "statusId",
      accessorFn: (row) => row.statusName,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <Status status={getIssueStatusVariant(row.original.statusName)}>
          <StatusIndicator />
          <StatusLabel className="capitalize">{row.original.statusName}</StatusLabel>
        </Status>
      ),
    },
    {
      accessorKey: "priority",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" />,
      cell: ({ row }) => (
        <Status status={getPriorityVariant(row.original.priority)}>
          <StatusIndicator />
          <StatusLabel className="capitalize">{row.original.priority}</StatusLabel>
        </Status>
      ),
    },
    // {
    //   accessorKey: "assigneeName",
    //   header: ({ column }) => <DataTableColumnHeader column={column} title="Assignee" />,
    //   cell: ({ row }) => row.original.assigneeName ?? "-",
    // },
    {
      id: "projectId",
      accessorFn: (row) => row.projectName,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Project" />,
      cell: ({ row }) => row.original.projectName ?? "-",
    },
    {
      id: "milestoneId",
      accessorFn: (row) => row.milestoneName,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Milestone" />,
      cell: ({ row }) => row.original.milestoneName ?? "-",
    },
    // {
    //   accessorKey: "labels",
    //   header: () => <span>Labels</span>,
    //   enableSorting: false,
    //   cell: ({ row }) => (
    //     <span className="text-xs text-muted-foreground">
    //       {row.original.labels.join(", ") || "-"}
    //     </span>
    //   ),
    // },
  ];
}
