---
name: ==datatable-master
description: Replicates the exact admin master datatable implementation pattern used in the State feature, including server page wiring, normalized table search params, query contract, table columns, row actions, and create/update form dialog flow. Use when creating or refactoring master data screens under app/admin/master to match the State feature structure exactly.
---

# State Datatable Master Pattern

## Goal

Implement master pages using the exact same structure and flow as the `State` feature in `app/admin/master/state`.

Follow this skill when building a similar master module (for example district, city, category) and keep the architecture unchanged.

## Required file structure

Create and keep this layout:

- `app/admin/master/<entity>/page.tsx`
- `app/admin/master/<entity>/_lib/query-<entity-plural>.ts`
- `app/admin/master/<entity>/_components/<entity>-page-content.tsx`
- `app/admin/master/<entity>/_components/<entity>-table.tsx`
- `app/admin/master/<entity>/_components/<entity>-table-columns.tsx`
- `app/admin/master/<entity>/_components/<entity>-form-dialog.tsx`

## Non-negotiable implementation rules

1. `page.tsx` must be a server component that:
   - calls `requireAdmin()`
   - redirects `401 -> /login`, `403 -> /onboarding`, fallback -> `/login`
   - loads params via `loadDataTableSearchParams(searchParams)`
   - normalizes with:
     - `defaultSort: "name"`
     - `defaultOrder: "asc"`
     - `defaultPageSize: 10`
     - `pageSizeOptions: [10, 20, 30, 40, 50]`
   - fetches `{ rows, totalCount }` from `_lib/query-*`
   - renders `<EntityPageContent items={rows} totalCount={totalCount} />` (naming can be entity-specific but contract must match)

2. Query module must:
   - export `<Entity>TableRow` with `id`, `name`, `createdAt`, `updatedAt` as strings
   - support text search on `id` OR `name` using `ilike` and `%keyword%`
   - apply paging (`limit`, `offset`) from normalized params
   - apply sortable columns map with safe fallback to `name`
   - return ISO strings for timestamps
   - return numeric `totalCount`

3. Columns module must:
   - use `ColumnDef<<Entity>TableRow>[]`
   - include `id` + `name`
   - use `DataTableColumnHeader` for sortable headers
   - render `id` with `font-medium`

4. Table module must:
   - render shared `<DataTable />`
   - pass `columns`, `data`, `rowCount`
   - set `searchPlaceholder="Search by id or name"`
   - set `defaultSort="name"` and `defaultOrder="asc"`
   - for faceted filters, pass `filters` with `columnId`, `title`, and `options`
   - when server paging is enabled (`manualPagination` flow), include `count` on each facet option from DB aggregates; do not rely on client `getFacetedUniqueValues()` counts for truth
   - include row actions dropdown with one `Edit` action and pencil icon

5. Page-content module must:
   - hold dialog state as discriminated union:
     - `{ open: false }`
     - `{ open: true; mode: "create" }`
     - `{ open: true; mode: "update"; <entity>: <Entity>TableRow }`
   - render `Heading` with top-right `Add <entity>` button
   - pass `onEdit` from table to open update dialog
   - render form dialog and reset to closed state on dismiss

6. Form-dialog module must:
   - be client component with `react-hook-form` + `zod` + `zodResolver`
   - define separate create/update schemas
   - make `id` read-only during update
   - submit to:
     - create: `POST /api/admin/master/<entity>`
     - update: `PATCH /api/admin/master/<entity>/${encodeURIComponent(values.id)}`
   - send body:
     - create: full values
     - update: mutable fields only (for State this is `{ name }`)
   - show toast success/error and `router.refresh()` on success

7. Facet-count behavior (server-side pagination):
   - compute facet counts in the query layer via SQL `group by` (or equivalent aggregate) over the full filtered dataset scope you intend to represent
   - return facet options as `{ value, label, count }`
   - include all needed facets from `_lib/query-*` and pass them from `page.tsx` -> page-content -> table
   - never present per-page counts as global counts

## Golden templates

Use these templates and only replace entity-specific names/routes/table schema fields.

### 1) `page.tsx`

```tsx
import { redirect } from "next/navigation";

import {
  normalizeDataTableSearchParams,
} from "@/components/data-table/search-params";
import { loadDataTableSearchParams } from "@/components/data-table/search-params.server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { get<EntityPlural>ForDataTable } from "./_lib/query-<entity-plural>";
import { <Entity>PageContent } from "./_components/<entity>-page-content";

export default async function Admin<Entity>MasterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const result = await requireAdmin();

  if ("error" in result) {
    if (result.status === 401) redirect("/login");
    if (result.status === 403) redirect("/onboarding");
    redirect("/login");
  }

  const parsedSearchParams = await loadDataTableSearchParams(searchParams);
  const normalizedSearchParams = normalizeDataTableSearchParams(parsedSearchParams, {
    defaultSort: "name",
    defaultOrder: "asc",
    defaultPageSize: 10,
    pageSizeOptions: [10, 20, 30, 40, 50],
  });

  const { rows, totalCount } = await get<EntityPlural>ForDataTable(normalizedSearchParams);

  return <<Entity>PageContent <entityPlural>={rows} totalCount={totalCount} />;
}
```

### 2) `_lib/query-<entity-plural>.ts`

```ts
import { and, asc, desc, ilike, or, sql, type SQL } from "drizzle-orm";
import { type NormalizedDataTableSearchParams } from "@/components/data-table/search-params";
import { db } from "@/lib/db/db";
import { <entityTable> } from "@/lib/db/schema";

export type <Entity>TableRow = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

const <ENTITY>_SORT_COLUMNS = {
  id: <entityTable>.id,
  name: <entityTable>.name,
  createdAt: <entityTable>.createdAt,
  updatedAt: <entityTable>.updatedAt,
} as const;

function getWhereClause(q: string): SQL | undefined {
  const keyword = q.trim();
  if (!keyword) return undefined;

  const pattern = `%${keyword}%`;
  return and(or(ilike(<entityTable>.id, pattern), ilike(<entityTable>.name, pattern)));
}

export async function get<EntityPlural>ForDataTable(params: NormalizedDataTableSearchParams) {
  const where = getWhereClause(params.q);
  const page = Math.max(1, params.page);
  const pageSize = Math.max(1, params.pageSize);
  const offset = (page - 1) * pageSize;
  const sortColumn =
    <ENTITY>_SORT_COLUMNS[params.sort as keyof typeof <ENTITY>_SORT_COLUMNS] ??
    <entityTable>.name;
  const sortDirection = params.order === "desc" ? desc(sortColumn) : asc(sortColumn);

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: <entityTable>.id,
        name: <entityTable>.name,
        createdAt: <entityTable>.createdAt,
        updatedAt: <entityTable>.updatedAt,
      })
      .from(<entityTable>)
      .where(where)
      .orderBy(sortDirection)
      .limit(pageSize)
      .offset(offset),
    db
      .select({
        totalCount: sql<number>`count(*)`,
      })
      .from(<entityTable>)
      .where(where),
  ]);

  return {
    rows: rows.map((item) => ({
      id: item.id,
      name: item.name,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
    totalCount: Number(countRows[0]?.totalCount ?? 0),
  };
}
```

### 3) `_components/<entity>-table-columns.tsx`

```tsx
"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table";
import { type <Entity>TableRow } from "../_lib/query-<entity-plural>";

export const <entity>TableColumns: ColumnDef<<Entity>TableRow>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
    cell: ({ row }) => <span className="font-medium">{row.original.id}</span>,
  },
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
  },
];
```

### 4) `_components/<entity>-table.tsx`

```tsx
"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { PencilIcon } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type <Entity>TableRow } from "../_lib/query-<entity-plural>";
import { <entity>TableColumns } from "./<entity>-table-columns";

export function <Entity>Table({
  <entityPlural>,
  totalCount,
  onEdit,
}: {
  <entityPlural>: <Entity>TableRow[];
  totalCount: number;
  onEdit: (row: <Entity>TableRow) => void;
}) {
  return (
    <DataTable
      columns={<entity>TableColumns}
      data={<entityPlural>}
      rowCount={totalCount}
      searchPlaceholder="Search by id or name"
      defaultSort="name"
      defaultOrder="asc"
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
```

### 5) `_components/<entity>-page-content.tsx` and `_components/<entity>-form-dialog.tsx`

For these two files, copy the State implementation structure exactly from:

- `app/admin/master/state/_components/state-page-content.tsx`
- `app/admin/master/state/_components/state-form-dialog.tsx`

Then replace only:

- entity names (`state`/`State`) and plural labels
- API route segments (`/api/admin/master/state`)
- form copy text (dialog title/description/placeholders)

Do not change the dialog state union model, `onEdit` flow, `onOpenChange` close reset, schema split (`create` vs `update`), or `router.refresh()` success behavior.

## Validation checklist (must pass)

- [ ] Auth + redirect behavior exactly matches State page.
- [ ] DataTable search/sort/page defaults match State values.
- [ ] Query returns `rows` and `totalCount` with ISO timestamps.
- [ ] If using faceted filters, each facet option includes DB-backed `count` (full dataset, not current page only).
- [ ] Columns include only `id` and `name` unless explicitly required.
- [ ] Row action menu contains `Edit` entry wired to dialog.
- [ ] Dialog supports both create and update mode.
- [ ] Update mode locks `id`.
- [ ] Successful save closes dialog and refreshes page.

## References

- `app/admin/master/state/page.tsx`
- `app/admin/master/state/_lib/query-states.ts`
- `app/admin/master/state/_components/state-page-content.tsx`
- `app/admin/master/state/_components/state-table.tsx`
- `app/admin/master/state/_components/state-table-columns.tsx`
- `app/admin/master/state/_components/state-form-dialog.tsx`
