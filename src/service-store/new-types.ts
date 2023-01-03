import type { Params } from '../types'
import type { Ref, ComputedRef } from 'vue-demi'
import type { Id, Query } from '@feathersjs/feathers'
import type { AnyData } from '../use-service'
import { ModelInstance } from '../use-base-model'

export interface UseGetOptions {
  id: Ref<Id | null> | ComputedRef<Id | null> | null
  params?: Ref<Params<Query>>
  queryWhen?: Ref<boolean>
  local?: boolean
  immediate?: boolean
}
export interface UseGetOptionsStandalone<M> extends UseGetOptions {
  model: M
}
export interface UseGetState {
  isPending: boolean
  hasBeenRequested: boolean
  hasLoaded: boolean
  error: null | Error
  isLocal: boolean
  request: Promise<any> | null
}
export interface UseGetComputed<M> {
  item: ComputedRef<M | null>
  servicePath: ComputedRef<string>
  isSsr: ComputedRef<boolean>
}

export interface QueryWhenContext {
  items: ComputedRef<AnyData[]>
  queryInfo: AnyData
  /**
   * Pagination data for the current qid
   */
  qidData: any
  queryData: any
  pageData: any
  isPending: ComputedRef<Boolean>
  haveBeenRequested: ComputedRef<Boolean>
  haveLoaded: ComputedRef<Boolean>
  error: any
}
export type QueryWhenFunction = ComputedRef<(context: QueryWhenContext) => boolean>

export interface UseFindWatchedOptions {
  params: Params<Query> | ComputedRef<Params<Query> | null>
  fetchParams?: ComputedRef<Params<Query> | null | undefined>
  queryWhen?: ComputedRef<boolean> | QueryWhenFunction
  qid?: string
  local?: boolean
  immediate?: boolean
}
export interface UseFindWatchedOptionsStandalone<M> extends UseFindWatchedOptions {
  model: M
}
export interface UseFindState {
  debounceTime: null | number
  qid: string
  isPending: boolean
  haveBeenRequested: boolean
  haveLoaded: boolean
  error: null | Error
  latestQuery: null | object
  isLocal: boolean
  request: Promise<any> | null
}
export interface UseFindComputed<M> {
  items: ComputedRef<M[]>
  servicePath: ComputedRef<string>
  paginationData: ComputedRef<AnyData>
  isSsr: ComputedRef<boolean>
}

export interface Association<M extends AnyData> {
  name: string
  Model: (data: ModelInstance<M>) => any
  type: 'find' | 'get'
}
export type BaseModelAssociations<M extends AnyData> = Record<string, Association<M>>


export interface FindClassParams extends Params<Query> {
  query: Query
  onServer?: boolean
  qid?: string
  immediate?: boolean
  watch?: boolean
}
export interface FindClassParamsStandalone extends FindClassParams {
  store: any
}
