import type { ComputedRef, Ref, UnwrapRef } from 'vue-demi'
import { DefineStoreOptionsBase, StateTree, Store } from 'pinia'
import { AnyData, ModelStatic } from './service-store/types'
import { BaseModel } from './service-store/base-model'
import { TypedActions, TypedGetters } from './utility-types'

export interface Filters {
  $sort?: { [prop: string]: -1 | 1 }
  $limit?: number
  $skip?: number
  $select?: string[]
}
export interface Query extends Filters, AnyData {}

export interface PaginationOptions {
  default?: number | true
  max?: number
}

export type AnyRef<M> = ComputedRef<M | null> | Ref<UnwrapRef<M> | null>

export type DiffDefinition = undefined | string | string[] | Record<string, any> | false

export interface Params extends AnyData {
  query?: Query
  paginate?: boolean | PaginationOptions
  provider?: string
  route?: Record<string, string>
  headers?: Record<string, any>
  temps?: boolean
  copies?: boolean
  qid?: string
  skipRequestIfExists?: boolean
  data?: any
  preserveSsr?: boolean
}
export interface PatchParams extends Params {
  data?: Partial<AnyData>
  diff?: DiffDefinition
  with?: DiffDefinition
  eager?: boolean
}

export interface Paginated<T> {
  total: number
  limit: number
  skip: number
  data: T[]
  fromSsr?: true
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

export type HandledEvents = 'created' | 'patched' | 'updated' | 'removed'
export type HandleEventsFunction<M extends BaseModel = BaseModel> = (
  item: any,
  ctx: { model: ModelStatic<M>; models: any },
) => any

export type HandleEvents<M extends BaseModel = BaseModel> = {
  [event in HandledEvents]: HandleEventsFunction<M>
}

export interface DefineStoreOptionsWithDefaults<
  Id extends string,
  S extends StateTree,
  G /* extends GettersTree<S> */,
  A /* extends Record<string, StoreAction> */,
  DefaultS extends StateTree,
  DefaultG,
  DefaultA,
> extends DefineStoreOptionsBase<S, Store<Id, S, G, A>> {
  state?: () => S

  getters?: TypedGetters<S, G, DefaultS, DefaultG>

  actions?: TypedActions<S, G, A, DefaultS, DefaultG, DefaultA>
}
