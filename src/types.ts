import type { ComputedRef, Ref, UnwrapRef } from 'vue-demi'
import { DefineStoreOptionsBase, StateTree, Store } from 'pinia'
import { TypedActions, TypedGetters } from './utility-types'
import type { Params as FeathersParams } from '@feathersjs/feathers'
import { AnyData } from './use-service'

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

export interface Params<Q extends Query> extends FeathersParams<Q> {
  query?: Q
  paginate?: boolean | PaginationOptions
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
export interface PatchParams<Q extends Query> extends Params<Q> {
  /**
   * For `create` and `patch`, only. Provide `params.data` to specify exactly which data should be passed to the API
   * server. This will disable the built-in diffing that normally happens before `patch` requests.
   */
  data?: Partial<AnyData>
  /**
   * For `patch` with clones, only. When you call patch (or save) on a clone, the data will be diffed before sending
   * it to the API server. If no data has changed, the request will be resolve without making a request. The `diff`
   * param lets you control which data gets diffed:
   *
   *   - `diff: string` will only include the prop matching the provided string.
   *   - `diff: string[]` will only include the props matched in the provided array of strings
   *   - `diff: object` will compare the provided `diff` object with the original.
   */
  diff?: DiffDefinition
  /**
   * For `patch` with clones, only. When you call patch (or save) on a clone, after the data is diffed, any data matching the `with`
   * param will also be included in the request.
   *
   *   - `with: string` will include the prop matchin the provided string.
   *   - `with: string[]` will include the props that match any string in the provided array.
   *   - `with: object` will include the exact object along with the request.
   */
  with?: DiffDefinition
  /**
   * For `patch` with clones, only. Set `params.eager` to false to prevent eager updates during patch requests. This behavior is enabled on patch
   * requests, by default.
   */
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
  response: Partial<Paginated<any>> | undefined
  isOutdated: boolean | undefined
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
