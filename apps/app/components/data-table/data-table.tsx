"use client"

import * as React from 'react'
import {
  type ColumnDef,
  type ColumnFiltersState,
  type OnChangeFn,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type Table as TanstackTable,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
} from '@tanstack/react-table'
import { useQueryStates } from 'nuqs'
import { Checkbox } from '@workspace/ui/components/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table'
import { DataTableBulkActions } from './bulk-actions'
import {
  dataTableSearchParamsParsers,
  normalizeDataTableSearchParams,
  type DataTableSearchParams,
} from './search-params'
import { DataTablePagination } from './pagination'
import { DataTableToolbar } from './toolbar'

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  rowCount: number
  searchPlaceholder?: string
  searchKey?: string
  filters?: {
    columnId: string
    title: string
    options: {
      label: string
      value: string
      icon?: React.ComponentType<{ className?: string }>
      count?: number
    }[]
  }[]
  renderRowActions?: (row: Row<TData>) => React.ReactNode
  defaultSort?: string
  defaultOrder?: 'asc' | 'desc'
  defaultPageSize?: number
  pageSizeOptions?: number[]
  enableRowSelection?: boolean
  showToolbar?: boolean
  bulkEntityName?: string
  bulkActions?: (table: TanstackTable<TData>) => React.ReactNode
  /** When set (e.g. moderators page with `tab`), must extend `dataTableSearchParamsParsers`. */
  searchParamsParsers?: typeof dataTableSearchParamsParsers
}

function resolveUpdater<T>(updater: T | ((old: T) => T), oldState: T): T {
  if (typeof updater === 'function') {
    return (updater as (value: T) => T)(oldState)
  }

  return updater
}

export function DataTable<TData, TValue>({
  columns,
  data,
  rowCount,
  searchPlaceholder = 'Search...',
  searchKey,
  filters = [],
  renderRowActions,
  defaultSort,
  defaultOrder = 'asc',
  defaultPageSize = 10,
  pageSizeOptions = [10, 20, 30, 40, 50],
  enableRowSelection = true,
  showToolbar = true,
  bulkEntityName = 'item',
  bulkActions,
  searchParamsParsers = dataTableSearchParamsParsers,
}: DataTableProps<TData, TValue>) {
  const [searchParams, setSearchParams] = useQueryStates(searchParamsParsers, {
    history: 'push',
    shallow: false,
  })

  const tableSearchParams = React.useMemo((): DataTableSearchParams => {
    const sp = searchParams as DataTableSearchParams & Record<string, unknown>
    return {
      page: sp.page,
      pageSize: sp.pageSize,
      sort: sp.sort,
      order: sp.order,
      q: sp.q,
      filters: sp.filters,
    }
  }, [searchParams])

  const normalized = React.useMemo(
    () =>
      normalizeDataTableSearchParams(tableSearchParams, {
        defaultSort,
        defaultOrder,
        defaultPageSize,
        pageSizeOptions,
      }),
    [
      defaultOrder,
      defaultPageSize,
      defaultSort,
      pageSizeOptions,
      tableSearchParams,
    ]
  )

  const pagination = React.useMemo<PaginationState>(
    () => ({
      pageIndex: Math.max(0, normalized.page - 1),
      pageSize: normalized.pageSize,
    }),
    [normalized.page, normalized.pageSize]
  )

  const sorting = React.useMemo<SortingState>(() => {
    if (!normalized.sort) {
      return []
    }

    return [{ id: normalized.sort, desc: normalized.order === 'desc' }]
  }, [normalized.order, normalized.sort])

  const columnFilters = React.useMemo<ColumnFiltersState>(() => {
    const nextFilters: ColumnFiltersState = Object.entries(normalized.filters).map(
      ([columnId, values]) => ({
        id: columnId,
        value: values,
      })
    )

    if (searchKey) {
      nextFilters.push({
        id: searchKey,
        value: normalized.q,
      })
    }

    return nextFilters
  }, [normalized.filters, normalized.q, searchKey])

  const globalFilter = searchKey ? undefined : normalized.q
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    {}
  )

  const composedColumns = React.useMemo<ColumnDef<TData, TValue>[]>(() => {
    const resolvedColumns = [...columns]

    if (enableRowSelection) {
      resolvedColumns.unshift({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label='Select all'
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label='Select row'
          />
        ),
        enableSorting: false,
        enableHiding: false,
      } as ColumnDef<TData, TValue>)
    }

    if (renderRowActions) {
      resolvedColumns.push({
        id: 'actions',
        header: () => <div className='text-right'>Actions</div>,
        cell: ({ row }) => (
          <div className='flex justify-end'>{renderRowActions(row)}</div>
        ),
        enableSorting: false,
        enableHiding: false,
      } as ColumnDef<TData, TValue>)
    }

    return resolvedColumns
  }, [columns, enableRowSelection, renderRowActions])

  const onPaginationChange: OnChangeFn<PaginationState> = React.useCallback(
    (updater) => {
      const next = resolveUpdater(updater, pagination)

      void setSearchParams({
        page: next.pageIndex + 1,
        pageSize: next.pageSize,
      })
    },
    [pagination, setSearchParams]
  )

  const onSortingChange: OnChangeFn<SortingState> = React.useCallback(
    (updater) => {
      const next = resolveUpdater(updater, sorting)
      const topSort = next[0]

      void setSearchParams({
        page: 1,
        sort: topSort?.id ?? '',
        order: topSort?.desc ? 'desc' : 'asc',
      })
    },
    [setSearchParams, sorting]
  )

  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = React.useCallback(
    (updater) => {
      const nextFilters = resolveUpdater(updater, columnFilters)

      let nextQuery = normalized.q
      const nextFacetedFilters: Record<string, string[]> = {}

      for (const filter of nextFilters) {
        if (searchKey && filter.id === searchKey) {
          nextQuery = String(filter.value ?? '').trim()
          continue
        }

        if (Array.isArray(filter.value)) {
          const values = filter.value
            .filter((value): value is string => typeof value === 'string')
            .map((value) => value.trim())
            .filter(Boolean)

          if (values.length > 0) {
            nextFacetedFilters[filter.id] = values
          }
        }
      }

      void setSearchParams({
        page: 1,
        q: nextQuery,
        filters: nextFacetedFilters,
      })
    },
    [columnFilters, normalized.q, searchKey, setSearchParams]
  )

  const onGlobalFilterChange: OnChangeFn<string> = React.useCallback(
    (updater) => {
      if (searchKey) {
        return
      }

      const nextQuery = String(resolveUpdater(updater, normalized.q) ?? '')
      void setSearchParams({
        page: 1,
        q: nextQuery.trim(),
      })
    },
    [normalized.q, searchKey, setSearchParams]
  )

  const table = useReactTable({
    data,
    columns: composedColumns,
    getCoreRowModel: getCoreRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    rowCount,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    enableRowSelection,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange,
    onGlobalFilterChange,
    state: {
      pagination,
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
      columnVisibility,
    },
  })

  return (
    <div className='space-y-4'>
      {showToolbar && (
        <DataTableToolbar
          table={table}
          searchKey={searchKey}
          searchPlaceholder={searchPlaceholder}
          filters={filters}
        />
      )}
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={composedColumns.length}
                  className='h-24 text-center text-muted-foreground'
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
      {enableRowSelection && bulkActions ? (
        <DataTableBulkActions table={table} entityName={bulkEntityName}>
          {bulkActions(table)}
        </DataTableBulkActions>
      ) : null}
    </div>
  )
}
