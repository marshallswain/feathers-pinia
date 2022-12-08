import type { Params, Paginated, QueryInfo } from '../types'
import type { Ref, ComputedRef } from 'vue-demi'
import type { Id, Query } from '@feathersjs/feathers'
import type { MaybeArray, MaybeRef } from '../utility-types'
import { BaseModelProps } from '../use-base-model'

export interface FindResponseAlwaysData<M extends AnyData> {
  data: M[]
  limit?: number
  skip?: number
  total?: number
}

// event locks
export type EventName = 'created' | 'patched' | 'updated' | 'removed'
export type EventLocks = {
  [key in EventName]: {
    [key: string]: boolean
  }
}

export type RequestTypeById = 'create' | 'patch' | 'update' | 'remove'

export type AnyData = Record<string, any>
export type AnyDataOrArray<M extends AnyData> = MaybeArray<M>

interface QueryPagination {
  $limit: number
  $skip: number
}
interface MostRecentQuery {
  pageId: string
  pageParams: QueryPagination
  queriedAt: number
  query: Query
  queryId: string
  queryParams: Query
  total: number
}

export interface CurrentQuery<M extends AnyData> extends MostRecentQuery {
  qid: string
  ids: number[]
  items: M[]
  total: number
  queriedAt: number
  queryState: PaginationStateQuery
}

/**
 * Pagination state types, below, are for the basic format shown here.
 *
 *
 * {
 *   // PaginationState
 *   pagination : {
 *     defaultLimit: 25,
 *     defaultSkip: 0,
 *
 *     // PaginationStateQid
 *     default: {
 *       mostRecent: {
 *         query: {},
 *         queryId: '{}',
 *         queryParams: {},
 *         pageId: '{$limit:25,$skip:0}',
 *         pageParams: { $limit: 25, $skip: 0 },
 *         queriedAt: 1538594642481
 *       },
 *
 *       // PaginationStateQuery
 *       '{}': {
 *         total: 155,
 *         queryParams: {},
 *
 *         // PaginationStatePage
 *         '{$limit:25,$skip:0}': {
 *           pageParams: { $limit: 25, $skip: 0 },
 *           ids: [ 1, 2, 3, 4, '...etc', 25 ],
 *           queriedAt: 1538594642481
 *         }
 *       }
 *     }
 *   }
 * }
 *
 */
export interface PaginationStatePage {
  ids: Id[]
  pageParams: QueryPagination
  queriedAt: number
  ssr: boolean
}
export type PaginationStateQuery = { [pageId: string]: PaginationStatePage } & {
  queryParams: Query
  total: number
}
export type PaginationStateQid = { [qid: string]: PaginationStateQuery } & { mostRecent: MostRecentQuery }
export type PaginationState = { [qid: string]: PaginationStateQid } & { defaultLimit: number; defaultSkip: number }

export type HandleFindResponseOptions<M extends AnyData, Q extends Query = Query> = {
  params: Params<Q>
  response: M[] | Paginated<M>
}
export type HandleFindErrorOptions<Q extends Query> = { params: Params<Q>; error: any }

// The find action will always return data at params.data, even for non-paginated requests.
// export type FindFn<C extends ModelConstructor = ModelConstructor, M extends InstanceType<C> = InstanceType<C>> = (
//   params?: MaybeRef<Params>,
// ) => Promise<Paginated<M>>
// export type GetFn<C extends ModelConstructor = ModelConstructor, M extends InstanceType<C> = InstanceType<C>> = (
//   id?: Id,
//   params?: MaybeRef<Params>,
// ) => Promise<M | undefined>
// export type GetFnWithId<C extends ModelConstructor = ModelConstructor, M extends InstanceType<C> = InstanceType<C>> = (
//   id: Id,
//   params?: MaybeRef<Params>,
// ) => Promise<M | undefined>
// export type UseGetFn<C extends ModelConstructor = ModelConstructor, M extends InstanceType<C> = InstanceType<C>> = (
//   _id: MaybeRef<Id | null>,
//   _params?: MaybeRef<GetClassParams>,
// ) => Get<M>

interface Association {
  name: string
  Model: any
  type: 'find' | 'get'
}
export type BaseModelAssociations = Record<string, Association>

export interface UpdatePaginationForQueryOptions {
  qid: string
  response: any
  query: any
  preserveSsr: boolean
}

export interface ModelInstanceOptions {
  /**
   * is creating clone
   */
  clone?: boolean
}

export interface BaseModelModifierOptions {
  store: any
}

export interface CloneOptions {
  useExisting?: boolean
}

export interface UseCloneOptions {
  useExisting?: boolean
  deep?: boolean
}

export interface QueryWhenContext {
  items: ComputedRef<AnyData[]>
  queryInfo: QueryInfo
  /**
   * Pagination data for the current qid
   */
  qidData: PaginationStateQid
  queryData: PaginationStateQuery
  pageData: PaginationStatePage
  isPending: ComputedRef<Boolean>
  haveBeenRequested: ComputedRef<Boolean>
  haveLoaded: ComputedRef<Boolean>
  error: any
}

export type QueryWhenFunction = ComputedRef<(context: QueryWhenContext) => boolean>

export interface GetClassParams<Q extends Query = Query> extends Params<Q> {
  query?: Q
  onServer?: boolean
  immediate?: boolean
}
export interface GetClassParamsStandalone extends GetClassParams {
  store: any
}
export interface FindClassParams<Q extends Query = Query> extends Params<Q> {
  query: Q
  onServer?: boolean
  qid?: string
  immediate?: boolean
  watch?: boolean
}
export interface FindClassParamsStandalone extends FindClassParams {
  store: any
}

export interface UseFindWatchedOptions<Q extends Query = Query> {
  params: Params<Q> | ComputedRef<Params<Q> | null>
  fetchParams?: ComputedRef<Params<Q> | null | undefined>
  queryWhen?: ComputedRef<boolean> | QueryWhenFunction
  qid?: string
  local?: boolean
  immediate?: boolean
}
export interface UseFindWatchedOptionsStandalone extends UseFindWatchedOptions {
  model: any
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
export interface UseFindComputed {
  items: ComputedRef<any[]>
  servicePath: ComputedRef<string>
  paginationData: ComputedRef<AnyData>
  isSsr: ComputedRef<boolean>
}

export interface UseGetOptions<Q extends Query = Query> {
  id: Ref<Id | null> | ComputedRef<Id | null> | null
  params?: Ref<Params<Q>>
  queryWhen?: Ref<boolean>
  local?: boolean
  immediate?: boolean
}
export interface UseGetOptionsStandalone extends UseGetOptions {
  model: any
}
export interface UseGetState {
  isPending: boolean
  hasBeenRequested: boolean
  hasLoaded: boolean
  error: null | Error
  isLocal: boolean
  request: Promise<any> | null
}
export interface UseGetComputed {
  item: ComputedRef<any | null>
  servicePath: ComputedRef<string>
  isSsr: ComputedRef<boolean>
}

export interface AssociateFindUtils {
  // extends Find<C, M>
  useFind: (params: MaybeRef<FindClassParams>) => any
}

export type HandledEvents = 'created' | 'patched' | 'updated' | 'removed'
export type HandleEventsFunction<M extends AnyData> = (item: M, ctx: { model: M; models: any }) => any

export type HandleEvents<M extends AnyData> =
  | {
      [event in HandledEvents]: HandleEventsFunction<M>
    }
  | boolean

export type onReadFn<M extends AnyData> = (item: M) => M | (Partial<M> & BaseModelProps<M>)
export type beforeWriteFn<M extends AnyData> = (item: M) => M | (Partial<M> & BaseModelProps<M>)
export type AssignFn<M extends AnyData> = (dest: M, src: M) => M | (Partial<M> & BaseModelProps<typeof dest>)
