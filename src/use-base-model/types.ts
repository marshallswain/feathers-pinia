import { Id } from '@feathersjs/feathers/lib'
import { ComputedRef } from 'vue'
import type { AnyData, CloneOptions } from '../use-service'

export interface UseBaseModelOptions {
  name: string
  idField: string
  whitelist?: string[]
  paramsForServer?: string[]
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
  readonly __Model: ModelFnTypeExtended<M>
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
   * Creates a copy of an item or temp record. The copy will have `__isClone` set to `true` and will be added to the
   * Model's clone storage. If not already stored, the original item  will be added to the appropriate store.
   * @param data
   * @param options
   */
  clone(this: M, data?: Partial<M>, options?: CloneOptions): M
  /**
   * Copies a clone's data onto the original item or temp record.
   * @param data
   * @param options
   */
  commit(this: M, data?: Partial<M>, options?: CloneOptions): M
  /**
   * Resets a clone's data to match the original item or temp record. If additional properties were added to the clone,
   * they will be removed to exactly match the original.
   * @param data
   * @param options
   */
  reset(this: M, data?: Partial<M>, options?: CloneOptions): M
  /**
   * Adds the current instance to the appropriate store. If the instance is a clone, it will be added to `clones`. If it
   * has an `idField`, it will be added to items, otherwise it will be added to temps.
   */
  addToStore(this: M): M
  /**
   * Removes the current instance from items, temps, and clones.
   */
  removeFromStore(this: M): M
} & WithModel<M>

export type ModelInstanceData<M extends AnyData> = Partial<M & BaseModelData>
export type ModelInstance<M extends AnyData> = ModelInstanceData<M> & BaseModelInstanceProps<M>

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
export type ModelFnTypeExtended<M extends AnyData> = {
  (data: ModelInstance<M>): ModelInstance<M>
} & BaseModelStatic<M>

export interface BaseModelStore<M extends AnyData> {
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
  addToStore(data: ModelInstance<M>): ModelInstance<M>
  addToStore(data: ModelInstance<M>[]): ModelInstance<M>[]
  removeFromStore(data: ModelInstance<M>): ModelInstance<M>
  removeFromStore(data: ModelInstance<M>[]): ModelInstance<M>[]
  clearAll(): void
}

/**
 * The types provided by `useBaseModel` (a subset of the types provided by `useFeathersModel`)
 */
export interface BaseModelStatic<M extends AnyData> extends BaseModelStore<M> {
  store: BaseModelStore<M>
  setStore: (store: any) => void
}

export interface MakeCopyOptions {
  isClone: boolean
}
