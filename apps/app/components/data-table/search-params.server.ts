import { createLoader } from 'nuqs/server'
import { dataTableSearchParamsParsers } from './search-params'

export const loadDataTableSearchParams = createLoader(dataTableSearchParamsParsers)
