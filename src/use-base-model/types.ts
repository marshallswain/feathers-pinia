import { Id } from '@feathersjs/feathers/lib'
import { ComputedRef } from 'vue'
import type { AnyData, CloneOptions } from '../use-service'

export interface UseBaseModelOptions {
  name: string
  idField: string
}

/**
 * Similar to ReturnType<Function>, but works better for the purpose of inferring and extending Model functions.
 */
export type InferReturn<T> = T extends (...t: [...infer Arg]) => infer Res ? Res : never
export type ById<M> = Record<string | number | symbol, M>

export type BaseModelData = {
  /**
   * When creating an instance, set `isClone` to `true` to mark this instance as a clone.
   *
   * Note: Marking an item as a clone will not automatically add it to the clone storage.
   */
  __isClone?: boolean
  /**
   * if the data does not have an id, you can specify the __tempId during creation
   */
  __tempId?: string
}

export type WithModel<M extends AnyData> = {
  /**
   * The model function.
   */
  readonly __Model: ModelFnTypeExtended<M>
}

export type BaseModelInstanceProps<M extends AnyData = AnyData> = {
  clone<N extends M>(this: N, data?: Partial<M>, options?: CloneOptions): N
  commit<N extends M>(this: N, data?: Partial<M>, options?: CloneOptions): N
  reset<N extends M>(this: N, data?: Partial<M>, options?: CloneOptions): N
  addToStore<N extends M>(this: N): N
  removeFromStore<N extends M>(this: N): N
  /**
   * the name of the Model function
   */
  readonly __modelName: string
  /**
   * The `__isClone` property will be `true` if this instance is a clone.
   */
  readonly __isClone: boolean
  /**
   * the attribute on the data holding the id property
   */
  readonly __idField: string
  /**
   * the tempId will only be present if an idField is not
   */
  readonly __tempId: string
} & WithModel<M>

export type ModelInstanceData<M extends AnyData> = Partial<M & BaseModelData>
export type ModelInstance<M extends AnyData> = ModelInstanceData<M> & BaseModelInstanceProps<M>

/**
 * The basic Model function definition which gets passed to `useModelBase`. It gets extended by `useModelBase` and
 * becomes a type of `ModelFnTypeExtended`.
 */
export type ModelFnType<M extends AnyData> = {
  (data: Partial<M & BaseModelData>): M & BaseModelInstanceProps<M>
}

export interface BaseModelMethods<
  M extends AnyData,
  MExtended extends M & BaseModelInstanceProps<M> = M & BaseModelInstanceProps<M>,
> {
  additionalFields: string[]
  itemsById: ById<MExtended>
  items: ComputedRef<MExtended[]>
  itemIds: ComputedRef<Id[]>
  tempsById: ById<MExtended>
  temps: ComputedRef<MExtended[]>
  tempIds: ComputedRef<Id[]>
  clonesById: ById<MExtended>
  clones: ComputedRef<MExtended[]>
  cloneIds: ComputedRef<Id[]>
  clone(item: MExtended, data?: Partial<M>, options?: CloneOptions): MExtended
  commit(item: MExtended, data?: Partial<M>): MExtended
  reset(item: MExtended, data?: Partial<M>, options?: CloneOptions): MExtended
  addToStore(item: MExtended): MExtended
  removeFromStore(data: MExtended | MExtended[]): typeof data
  clearAll(): void
}

/**
 * The extended Model function definition, which includes storage-related properties.
 */
export type ModelFnTypeExtended<M extends AnyData> = {
  (data: ModelInstance<M>): ModelInstance<M>
  /**
   * non-enumerable fields on each instance that need to be handled when merging two instances
   */
  // additionalFields: string[]
  // itemsById: ById<NExtended>
  // items: ComputedRef<NExtended[]>
  // itemIds: ComputedRef<Id[]>
  // tempsById: ById<NExtended>
  // temps: ComputedRef<NExtended[]>
  // tempIds: ComputedRef<Id[]>
  // clonesById: ById<NExtended>
  // clones: ComputedRef<NExtended[]>
  // cloneIds: ComputedRef<Id[]>
  // clone(item: NExtended, data?: Partial<M>, options?: CloneOptions): NExtended
  // commit(item: NExtended, data?: Partial<M>): NExtended
  // reset(item: NExtended, data?: Partial<M>, options?: CloneOptions): NExtended
  // addToStore(item: NExtended): NExtended
  // removeFromStore(data: NExtended | NExtended[]): typeof data
  // clearAll(): void
}

export interface MakeCopyOptions {
  isClone: boolean
}
