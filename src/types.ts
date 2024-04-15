import type { Params as FeathersParams, Id } from '@feathersjs/feathers'
import type { ComputedRef } from 'vue-demi'
import type { MaybeRef } from '@vueuse/core'
import type { ServiceInstance } from './modeling/index.js'
import type { PaginationStateQuery } from './stores/index.js'

export type MaybeArray<T> = T | T[]
export type AnyData = Record<string, any>
export type AnyDataOrArray<M extends AnyData> = MaybeArray<M>

export type MaybeRefOrComputed<T> = MaybeRef<T> | ComputedRef<T>

export interface Filters {
  $sort?: { [prop: string]: number }
  $limit?: MaybeRef<number>
  $skip?: MaybeRef<number>
  $select?: string[]
}
export interface Query extends Filters, AnyData { }

export interface CustomFilter {
  key: string
  operator: <M>(items: M[], queryValue: any, query: Record<string, any>) => M[]
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
  pageParams: { $limit: MaybeRef<number>, $skip: MaybeRef<number> | undefined } | undefined
  pageId: string | undefined
  isExpired: boolean
}

export interface QueryInfoExtended extends QueryInfo {
  ids: Id[]
  items: AnyData | ServiceInstance<AnyData>[]
  total: number
  queriedAt: number
  queryState: PaginationStateQuery
}
export type ExtendedQueryInfo = QueryInfoExtended | null

export type DiffDefinition = undefined | string | string[] | Record<string, any> | false

export interface PaginationOptions {
  default?: number | true
  max?: number
}

export interface Params<Q extends Query> extends FeathersParams<Q> {
  query?: Q
  paginate?: boolean | PaginationOptions
  provider?: string
  route?: Record<string, string>
  headers?: Record<string, any>
  temps?: boolean
  clones?: boolean
  qid?: string
  ssr?: boolean
  skipGetIfExists?: boolean
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

// for cloning
export interface MakeCopyOptions {
  isClone: boolean
}

export type ById<M> = Record<string | number | symbol, M>
