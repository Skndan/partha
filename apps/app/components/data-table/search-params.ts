import {
  parseAsInteger,
  parseAsJson,
  parseAsString,
  parseAsStringLiteral,
  type inferParserType,
} from 'nuqs/server'

const sortOrders = ['asc', 'desc'] as const

type TableFilterState = Record<string, string[]>

function parseTableFilterState(value: unknown): TableFilterState | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const parsed: TableFilterState = {}

  for (const [key, entry] of Object.entries(value)) {
    if (!Array.isArray(entry)) {
      continue
    }

    parsed[key] = entry
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return parsed
}

export const dataTableSearchParamsParsers = {
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
  sort: parseAsString.withDefault(''),
  order: parseAsStringLiteral(sortOrders).withDefault('asc'),
  q: parseAsString.withDefault(''),
  filters: parseAsJson<TableFilterState>(parseTableFilterState).withDefault({}),
}

export type DataTableSearchParams = inferParserType<
  typeof dataTableSearchParamsParsers
>

export type NormalizeDataTableSearchParamsOptions = {
  defaultSort?: string
  defaultOrder?: 'asc' | 'desc'
  defaultPageSize?: number
  pageSizeOptions?: number[]
}

function normalizePageSize(pageSize: number, options?: number[]) {
  if (!options || options.length === 0) {
    return Math.max(1, pageSize)
  }

  const sorted = [...options].sort((a, b) => a - b)
  if (sorted.includes(pageSize)) {
    return pageSize
  }

  return sorted[0] ?? 10
}

export function normalizeDataTableSearchParams(
  params: DataTableSearchParams,
  options: NormalizeDataTableSearchParamsOptions = {}
) {
  const page = Math.max(1, params.page)
  const pageSize = normalizePageSize(
    params.pageSize || options.defaultPageSize || 10,
    options.pageSizeOptions
  )
  const sort = params.sort || options.defaultSort || ''
  const order = params.order || options.defaultOrder || 'asc'
  const q = params.q.trim()

  return {
    page,
    pageSize,
    sort,
    order,
    q,
    filters: params.filters ?? {},
  }
}

export type NormalizedDataTableSearchParams = ReturnType<
  typeof normalizeDataTableSearchParams
>
