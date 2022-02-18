import { AnyData } from './service-store/types'

export interface Filters {
  $sort?: { [prop: string]: -1 | 1 }
  $limit?: number
  $skip?: number
  $select?: string[]
}
export interface Query extends Filters, AnyData {}

export interface PaginationOptions {
  default: number
  max: number
}

export interface Params extends AnyData {
  query?: Query
  paginate?: boolean | Pick<PaginationOptions, 'max'>
  provider?: string
  route?: Record<string, string>
  headers?: Record<string, any>
  temps?: boolean
  clones?: boolean
  qid?: string
  skipRequestIfExists?: boolean
  data?: any
  preserveSsr?: boolean
}
export interface Paginated<T> {
  total: number
  limit: number
  skip: number
  data: T[]
}

export interface QueryInfo {
  qid: string
  query: Query
  queryId: string
  queryParams: Query
  pageParams: { $limit: number; $skip: number | undefined } | undefined
  pageId: string | undefined
  response: Paginated<any[]> | undefined
  isOutdated: boolean | undefined
}

export interface HandleEvents {
  created?: Function
  patched?: Function
  updated?: Function
  removed?: Function
}
