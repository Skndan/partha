"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/data-table";
import { type ProjectTableRow } from "./types";

export function getProjectTableColumns(slug: string): ColumnDef<ProjectTableRow>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Project" />,
      cell: ({ row }) => (
        <Link
          className="font-medium underline-offset-4 hover:underline cursor-pointer"
          href={`/${slug}/project/${row.original.id}/overview`}
        >
          {/* {row.original.key} -  */}
          {row.original.name}
        </Link>
      ),
    },
    {
      id: "teamId",
      accessorFn: (row) => row.teamName ?? "",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Team" />,
      cell: ({ row }) => row.original.teamName ?? "-",
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <span className="capitalize">{row.original.status.replace("_", " ")}</span>,
    },
    {
      accessorKey: "targetDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Target Date" />,
      cell: ({ row }) => row.original.targetDate ?? "-",
    },
  ];
}
