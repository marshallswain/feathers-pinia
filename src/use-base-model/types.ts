import type { Id, Service } from '@feathersjs/feathers'
import type { ComputedRef, UnwrapNestedRefs } from 'vue-demi'
import type { Params } from '../types'
import { type AnyData, type CloneOptions, useService, useServiceApiFeathers } from '../use-service'
import { useFind } from '../use-find'
import { useGet } from '../use-get'

export interface UseBaseModelOptions {
  name: string
  idField: string
  whitelist?: string[]
  paramsForServer?: string[]
}
export interface UseFeathersModelOptions extends UseBaseModelOptions {
  service: Service
}

export interface MakeCopyOptions {
  isClone: boolean
}

/**
 * Similar to ReturnType<Function>, but works better for the purpose of inferring and extending Model functions.
 */
export type InferReturn<T> = T extends (...t: [...infer Arg]) => infer Res ? Res : never
export type ById<M> = Record<string | number | symbol, M>

export type BaseModelData = {
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

export type WithModel<M extends AnyData> = {
  /**
   * This instance's Model function.
   */
  readonly __Model: ModelFnTypeExtended<M, AnyData>
}

export type BaseModelInstanceProps<M extends AnyData = AnyData> = {
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
   * Creates a copy of an item or temp record. The copy will have `__isClone` set to `true` and will be added to the
   * Model's clone storage. If not already stored, the original item  will be added to the appropriate store.
   * @param data
   * @param options
   */
  clone<N extends ModelInstance<M>>(this: N, data?: Partial<M>, options?: CloneOptions): N
  /**
   * Copies a clone's data onto the original item or temp record.
   * @param data
   * @param options
   */
  commit<N extends ModelInstance<M>>(this: N, data?: Partial<M>, options?: CloneOptions): N
  /**
   * Resets a clone's data to match the original item or temp record. If additional properties were added to the clone,
   * they will be removed to exactly match the original.
   * @param data
   * @param options
   */
  reset<N extends ModelInstance<M>>(this: N, data?: Partial<M>, options?: CloneOptions): N
  /**
   * Adds the current instance to the appropriate store. If the instance is a clone, it will be added to `clones`. If it
   * has an `idField`, it will be added to items, otherwise it will be added to temps.
   */
  addToStore<N extends ModelInstance<M>>(this: N): N
  /**
   * Removes the current instance from items, temps, and clones.
   */
  removeFromStore<N extends ModelInstance<M>>(this: N): N
} & WithModel<M>

export type ModelInstanceData<M extends AnyData> = Partial<M & BaseModelData>
export type ModelInstance<M extends AnyData> = ModelInstanceData<M> & BaseModelInstanceProps<M>
export type FeathersInstanceMethods<M extends AnyData, Q extends AnyData, P extends Params<Q> = Params<Q>> = {
  save: <N extends AnyData>(this: N, params?: P) => Promise<N>
  create: (this: ModelInstance<M>, params?: P) => Promise<M>
  patch: (this: ModelInstance<M>, params?: P) => Promise<M>
  remove: (this: ModelInstance<M>, params?: P) => Promise<M>
}
export type FeathersInstance<M extends AnyData, Q extends AnyData> = ModelInstanceData<M> &
  BaseModelInstanceProps<M> &
  FeathersInstanceMethods<M, Q>

/**
 * The basic Model function definition which gets passed to `useModelBase`. It gets extended by `useModelBase` and
 * becomes a type of `ModelFnTypeExtended`.
 */
export type ModelFnType<M extends AnyData> = {
  (data: ModelInstanceData<M>): M & BaseModelInstanceProps<M>
}

/**
 * The extended Model function definition, which includes storage-related properties.
 */
export type ModelFnTypeExtended<M extends AnyData, Q extends AnyData> = {
  (data: ModelInstance<M>): ModelInstance<M>
} & BaseModelStatic<M, Q>

export interface SharedModelStoreMethods<M extends AnyData, Q extends AnyData> {
  addToStore<N extends ModelInstance<M>>(data: N): N
  addToStore<N extends ModelInstance<M>>(data: N[]): N[]
  removeFromStore<N extends ModelInstance<M>>(data: N): N
  removeFromStore<N extends ModelInstance<M>>(data: N[]): N[]
  findInStore<N extends ModelInstance<M>>(params: Params<Q>): { total: number; limit: number; skip: number; data: N[] }
  countInStore(params: Params<Q>): number
  getFromStore<N extends ModelInstance<M>>(id: Id | null, params?: Params<Q> | undefined): N | null
}

/**
 * Types for `Model.store`
 */
export interface BaseModelStore<M extends AnyData, Q extends AnyData> extends SharedModelStoreMethods<M, Q> {
  additionalFields: string[]
  itemsById: ById<ModelInstance<M>>
  items: ComputedRef<ModelInstance<M>[]>
  itemIds: ComputedRef<Id[]>
  tempsById: ById<ModelInstance<M>>
  temps: ComputedRef<ModelInstance<M>[]>
  tempIds: ComputedRef<Id[]>
  clonesById: ById<ModelInstance<M>>
  clones: ComputedRef<ModelInstance<M>[]>
  cloneIds: ComputedRef<Id[]>
  clone(item: ModelInstance<M>, data?: Partial<M>, options?: CloneOptions): ModelInstance<M>
  commit(item: ModelInstance<M>, data?: Partial<M>): ModelInstance<M>
  reset(item: ModelInstance<M>, data?: Partial<M>, options?: CloneOptions): ModelInstance<M>
  clearAll(): void
}

export type BaseModelStoreUnwrapped<M extends AnyData, Q extends AnyData> = UnwrapNestedRefs<BaseModelStore<M, Q>>

export type UseServiceStore<
  M extends AnyData,
  D extends AnyData,
  Q extends AnyData,
  ModelFunc extends (data: ModelInstance<M>) => any,
> = ReturnType<typeof useService<M, D, Q, ModelFunc>>

// export interface FeathersModelStore<M extends AnyData, Q extends AnyData> extends BaseModelStore<M, Q> {
//   find: (_params?: MaybeRef<Params<Q>> | undefined) => Promise<FindResponseAlwaysData<M>>
// }

/**
 * Types for `Model` (useBaseModel)
 */
export interface BaseModelStatic<M extends AnyData, Q extends AnyData> extends SharedModelStoreMethods<M, Q> {
  store: BaseModelStoreUnwrapped<M, Q>
  setStore: (store: any) => void
}

type ApiFeathers<M extends AnyData, D extends AnyData, Q extends AnyData> = ReturnType<
  typeof useServiceApiFeathers<M, D, Q>
>

/**
 * Types for `FeathersModel` (useFeathersModel)
 */
export interface FeathersModelStatic<
  M extends AnyData,
  D extends AnyData,
  Q extends AnyData,
  ModelFunc extends (data: ModelInstance<M>) => any,
> extends SharedModelStoreMethods<M, Q>,
    ApiFeathers<M, D, Q> {
  store: UseServiceStore<M, D, Q, ModelFunc>
  setStore: (store: any) => void
  useFind: typeof useFind
  useGet: typeof useGet
  useGetOnce: typeof useGet
  useFindWatched: any
  useGetWatched: any
}
