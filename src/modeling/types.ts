import type { AnyData, PatchParams } from '../types.js'
import type { CloneOptions } from '../stores/index.js'

export interface BaseModelData {
  /**
   * Indicates if this instance is a clone.. It will be
   *
   * - `true` after calling `instance.clone()`
   * - `false` after calling `instance.commit()`.
   *
   * Should not be set manually when creating new instances.
   */
  __isClone?: boolean
  /**
   * If no idField is specified, `__tempId` can be manually specified, otherwise a random one will be added for you.
   * The automatically-added `__tempId` values are valid ObjectId strings.
   */
  __tempId?: string
}

export interface StoreInstanceProps<M extends AnyData = AnyData> {
  /**
   * The name of the Model function
   */
  readonly __modelName: string

  // see `BaseModelData.__isClone`
  readonly __isClone: boolean
  /**
   * The attribute on the data holding the unique id property. It will match whatever was provided in the Model options.
   * This value should match the API service. General `idField` values are as follows:
   *
   * - `id` for SQL databases
   * - `_id` for MongoDB
   */
  readonly __idField: string

  // see `BaseModelData.__tempId`
  readonly __tempId: string
  /**
   * A boolean indicating if the instance is a temp. Will be `true` if the instance does not have an idField. This is
   * the only reliable way to determine if a record is a temp or not, since after calling `temp.save`, the temp will
   * have both a `__tempId` and a real idField value.
   */
  readonly __isTemp: boolean
  /**
   * Returns the item's clone from the store, if one exists.
   */
  hasClone<N extends AnyData>(this: N): N | null
  /**
   * Creates a copy of an item or temp record. The copy will have `__isClone` set to `true` and will be added to the
   * Model's clone storage. If not already stored, the original item  will be added to the appropriate store.
   * @param data
   * @param options
   */
  clone<N extends AnyData>(
    this: N,
    data?: Partial<M>,
    options?: CloneOptions
  ): N
  /**
   * Copies a clone's data onto the original item or temp record.
   * @param data
   * @param options
   */
  commit<N extends AnyData>(
    this: N,
    data?: Partial<M>,
    options?: CloneOptions
  ): N
  /**
   * Resets a clone's data to match the original item or temp record. If additional properties were added to the clone,
   * they will be removed to exactly match the original.
   * @param data
   * @param options
   */
  reset<N extends AnyData>(
    this: N,
    data?: Partial<M>,
    options?: CloneOptions
  ): N
  /**
   * Adds the current instance to the appropriate store. If the instance is a clone, it will be added to `clones`. If it
   * has an `idField`, it will be added to items, otherwise it will be added to temps.
   */
  createInStore<N extends AnyData>(this: N): N
  /**
   * Removes the current instance from items, temps, and clones.
   */
  removeFromStore<N extends AnyData>(this: N): N
}

export type ModelInstanceData<M extends AnyData> = Partial<M & BaseModelData>
export type ModelInstance<M extends AnyData> = ModelInstanceData<M> &
  StoreInstanceProps<M>

export interface ServiceInstanceProps<
  M extends AnyData,
  Q extends AnyData,
  P extends PatchParams<Q> = PatchParams<Q>
> {
  readonly isSavePending: boolean
  readonly isCreatePending: boolean
  readonly isPatchPending: boolean
  readonly isRemovePending: boolean
  save: <N extends AnyData>(this: N, params?: P) => Promise<N>
  create: (this: ModelInstance<M>, params?: P) => Promise<M>
  patch: (this: ModelInstance<M>, params?: P) => Promise<M>
  remove: (this: ModelInstance<M>, params?: P) => Promise<M>
}
export type ServiceInstance<
  M extends AnyData,
  Q extends AnyData = AnyData
> = ModelInstanceData<M> & StoreInstanceProps<M> & ServiceInstanceProps<M, Q>
