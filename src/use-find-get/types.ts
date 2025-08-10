import type { Ref } from 'vue-demi'
import type { MostRecentQuery, PaginationStateQuery } from '../stores/types'
import type { AnyData, Params, Query } from '../types.js'

export interface UseFindPage {
  limit: Ref<number>
  skip: Ref<number>
}

export interface UseFindGetDeps {
  service: any
}

export interface UseFindParams extends Params<Query> {
  query: Query
  qid?: string
}

export interface UseFindOptions {
  paginateOn?: 'client' | 'server' | 'hybrid'
  pagination?: UseFindPage
  debounce?: number
  immediate?: boolean
  watch?: boolean
}

export interface UseGetParams extends Params<Query> {
  query?: Query
  immediate?: boolean
  watch?: boolean
}

export interface CurrentQuery<M extends AnyData> extends MostRecentQuery {
  qid: string
  ids: number[]
  items: M[]
  total: number
  queriedAt: number
  queryState: PaginationStateQuery
}
