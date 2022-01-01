import { Ref, ComputedRef } from 'vue-demi'
import { Params, Paginated, QueryInfo } from '../types'
import { EventEmitter } from 'events'
import { Id, Query } from '@feathersjs/feathers'

interface PendingById {
  create?: boolean
  patch?: boolean
  update?: boolean
  remove?: boolean
}
interface ModelPendingState {
  find?: boolean
  count?: boolean
  get?: boolean
}
export type RequestType = 'find' | 'count' | 'get' | 'patch' | 'update' | 'remove'

export type AnyData = Record<string, any>

type ModelsById<M> = { [id: string | number]: M }

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

/**
 * Pagination State Types: below are types for the basic format shown here.
 * I'm surprised that something like the below can't work in TypeScript. Instead,
 * it has to be spread across the jumbled mess of interfaces and types shown below.
 * If somebody has knowledge of a cleaner representation, I'd appreciate a PR. - Marshall
 *
 * interface PaginationState {
 *   [queryId: string]: {
 *     [pageId: string]: {
 *       ids: Id[]
 *       pageParams: QueryPagination
 *       queriedAt: number
 *       ssr: boolean
 *     }
 *     queryParams: Query
 *     total: number
 *   }
 *   mostRecent: MostRecentQuery
 * }
 */
export interface PaginationPageData {
  ids: Id[]
  pageParams: QueryPagination
  queriedAt: number
  ssr: boolean
}
export type PaginationStatePage = {
  [pageId: string]: PaginationPageData
}
export type PaginationStateQuery =
  | PaginationStatePage
  | {
      queryParams: Query
      total: number
    }
export type PaginationStateQid =
  | PaginationStateQuery
  | {
      mostRecent: MostRecentQuery
    }

export interface ServiceState<M extends Model = Model> {
  clientAlias: string
  servicePath: string
  pagination: {
    [qid: string]: PaginationStateQid
  }
  idField: string
  itemsById: ModelsById<M>
  tempsById: ModelsById<M>
  clonesById: ModelsById<M>
  pendingById: {
    [id: string]: PendingById | ModelPendingState
    [id: number]: PendingById
  }
  eventLocksById: {
    created: ModelsById<M>
    patched: ModelsById<M>
    updated: ModelsById<M>
    removed: ModelsById<M>
  }
  whitelist?: string[]
}
export type ServiceGetters = AnyData

export interface ServiceActions extends AnyData {
  handleFindError({ params, error }: { params: Params; error: any }): Promise<any>
}
export interface PiniaStoreOptions {
  state: ServiceState
  getters: ServiceGetters
  actions: ServiceActions
}

export interface ServiceOptions {
  ssr?: boolean
  clients: AnyData
  id: string
  clientAlias?: string
  idField?: string
  servicePath: string
  Model: any
  state?: AnyData
  getters?: Record<string, Function>
  actions?: Record<string, Function>
  whitelist?: string[]
}

export interface PatchParams<D extends AnyData> extends Params {
  data?: Partial<D>
}

/** Model instance interface */
export interface Model extends AnyData {
  /**
   * model's temporary ID
   */
  readonly __id?: string
  /**
   * model is temporary?
   */
  readonly __isTemp?: boolean
  /**
   * model is a clone?
   */
  readonly __isClone?: boolean

  /**
   * `Create` is currently pending on this model
   */
  readonly isCreatePending: boolean
  /**
   * `Update` is currently pending on this model
   */
  readonly isUpdatePending: boolean
  /**
   * `Patch` is currently pending on this model
   */
  readonly isPatchPending: boolean
  /**
   * `Remove` is currently pending on this model
   */
  readonly isRemovePending: boolean
  /**
   * Any of `create`, `update` or `patch` is currently pending on this model
   */
  readonly isSavePending: boolean
  /**
   * Any method is currently pending on this model
   */
  readonly isPending: boolean

  /**
   * Creates a deep copy of the record and stores it on
   * `Model.clonesById`. This allows you to make changes
   * to the clone and not update visible data until you
   * commit or save the data.
   * @param data Properties to modify on the cloned instance
   */
  clone(data?: AnyData): this
  /**
   * The create method calls the create action (service method)
   * using the instance data.
   * @param params Params passed to the Feathers client request
   */
  create(params?: Params): Promise<this>
  /**
   * The patch method calls the patch action (service method)
   * using the instance data. The instance's id field is used
   * for the patch id.
   *
   * You can provide an object as `params.data`, and Feathers-Pinia
   * will use `params.data` as the patch data. This allows patching
   * with partial data.
   * @param params Params passed to the Feathers client request
   */
  patch<D extends AnyData>(params?: PatchParams<D>): Promise<this>
  /**
   * The remove method calls the remove action (service method)
   * using the instance data. The instance's id field is used
   * for the remove id.
   * @param params Params passed to the Feathers client request
   */
  remove(params?: Params): Promise<this>
  /**
   * The update method calls the update action (service method)
   * using the instance data. The instance's id field is used for
   * the update id.
   * @param params Params passed to the Feathers client request
   */
  update(params?: Params): Promise<this>
  /**
   * The save method is a convenience wrapper for the create/patch
   * methods, by default. If the records has no _id, the
   * instance.create() method will be used.
   * @param params Params passed to the Feathers client request
   */
  save(params?: Params): Promise<this>

  /**
   * Commit changes from clone to original
   */
  commit(): this

  /**
   * Discards changes made on this clone and syncs with the original
   */
  reset(): this
}

/** Static Model interface */
export interface ModelStatic extends EventEmitter {
  /**
   * The path passed to `FeathersClient.service()` to create the service
   */
  servicePath: string

  /**
   * The pinia store
   */
  readonly store: any

  /**
   * The field in each record that will contain the ID
   */
  idField: string

  /**
   * The client alias in the global `models` object
   */
  clientAlias: string

  /**
   * Model name used to circumvent Babel transpilation errors
   */
  modelName: string

  /**
   * All model copies created using `model.clone()`
   */
  readonly clonesById: { [id: string | number]: Model | undefined }

  /**
   * Create new Model
   * @param data partial model data
   * @param options model instance options
   */
  new (data?: AnyData, options?: ModelInstanceOptions): Model
  prototype: Model

  /**
   * The instanceDefaults API prevents requiring to specify data for new
   * instances created throughout the app. Depending on the complexity of the
   * service's "business logic", it can save a lot of boilerplate. Notice that
   * it is similar to the setupInstance method added in 2.0. The instanceDefaults
   * method should ONLY be used to return default values for a new
   * instance. Use setupInstance to handle other transformations on
   * the data.
   * @param data the instance data
   */
  instanceDefaults(data: AnyData): AnyData

  /**
   * The setupInstance method allows you to transform the data and setup the
   * final instance based on incoming data. For example, you can access the
   * models object to reference other service Model classes and create
   * data associations.
   * @param data the instance data
   * @param ctx setup context
   */
  setupInstance(data: AnyData): AnyData

  /**
   * A proxy for the `find` action
   * @param params Find params
   */
  find<M extends Model = Model>(params?: Params): Promise<M[] | Paginated<M>>

  /**
   * A proxy for the `findInStore` getter
   * @param params Find params
   */
  findInStore<M extends Model = Model>(params?: Params | Ref<Params>): Paginated<M>

  /**
   * A proxy for the `count` action
   * @param params Find params
   */
  count(params?: Params): Promise<number>

  /**
   * A proxy for the `countInStore` getter
   * @param params Find params
   */
  countInStore(params?: Params | Ref<Params>): number

  /**
   * A proxy for the `get` action
   * @param id ID of record to retrieve
   * @param params Get params
   */
  get<M extends Model = Model>(id: Id, params?: Params): Promise<M | undefined>

  /**
   * A proxy for the `getFromStore` getter
   * @param id ID of record to retrieve
   * @param params Get params
   */
  getFromStore<M extends Model = Model>(
    id: Id | Ref<Id>,
    params?: Params | Ref<Params>,
  ): M | undefined
}

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

export interface QueryWhenContext {
  items: ComputedRef<AnyData[]>
  queryInfo: QueryInfo
  /**
   * Pagination data for the current qid
   */
  qidData: PaginationStateQid
  queryData: PaginationStateQuery
  pageData: PaginationStatePage
}
export type QueryWhenFunction = ComputedRef<(context: QueryWhenContext) => boolean>
