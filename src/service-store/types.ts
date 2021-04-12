import { Ref } from 'vue'
import { Params, Paginated } from '../types'
import { StateTree } from 'pinia'
import { Service, Id } from '@feathersjs/feathers'

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

export interface ServiceState<M extends Model = Model> {
  clientAlias: string
  servicePath: string
  pagination: {
    [k: string]: any
  }
  idField: string
  ids: string[]
  itemsById: {
    [k: string]: M
    [k: number]: M
  }
  clonesById: {
    [k: string]: M
    [k: number]: M
  }
  pendingById: {
    [k: string]: PendingById | ModelPendingState
    [k: number]: PendingById
  }
}
export interface ServiceGetters {
  [k: string]: any
}
export interface ServiceActions {
  [k: string]: any
}
export interface PiniaStoreOptions {
  state: ServiceState
  getters: ServiceGetters
  actions: ServiceActions
}

export interface ServiceOptions {
  clients: { [key: string]: any }
  storeId: string
  clientAlias?: string
  idField?: string
  servicePath: string
  Model: any
}

export type AnyData = { [key: string]: any }

export interface PatchParams<D extends {} = AnyData> extends Params {
  data?: Partial<D>
}

/** Model instance interface */
export interface Model {
  [key: string]: any
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
   * You can provide an object as `params.data`, and Feathers-Vuex
   * will use `params.data` as the patch data. This allows patching
   * with partial data.
   * @param params Params passed to the Feathers client request
   */
  patch<D extends {} = AnyData>(params?: PatchParams<D>): Promise<this>
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

export interface UpdatePaginationForQueryOptions {
  qid: string
  response: any
  query: any
}

export interface ModelInstanceOptions {
  /**
   * is creating clone
   */
  clone?: boolean

  /**
   * add/commit to store
   */
  commit?: boolean

  /**
   * merge with existing data
   */
  merge?: boolean
}
