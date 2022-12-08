import { Id } from '@feathersjs/feathers/lib'
import type { AnyData, CloneOptions } from '../use-service'

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

export type BaseModelProps<M extends AnyData = AnyData> = {
  clone<N extends M>(this: N, data?: Partial<M>, options?: CloneOptions): N
  commit<N extends M>(this: N, data?: Partial<M>, options?: CloneOptions): N
  reset<N extends M>(this: N, data?: Partial<M>, options?: CloneOptions): N
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

/**
 * The basic Model function definition which gets passed to `useModelBase`. It gets extended by `useModelBase` and
 * becomes a type of `ModelFnTypeExtended`.
 */
export type ModelFnType<M extends AnyData> = {
  (data: Partial<M & BaseModelData>): M & BaseModelProps<M>
}

/**
 * The extended Model function definition, which includes storage-related properties.
 */
export type ModelFnTypeExtended<M extends AnyData, MExtended extends M & BaseModelProps<M> = M & BaseModelProps<M>> = {
  (data: Partial<M & BaseModelData>): MExtended
  /**
   * non-enumerable fields on each instance that need to be handled when merging two instances
   */
  additionalFields: string[]
  itemsById: ById<MExtended>
  items: MExtended[]
  ids: Id[]
  tempsById: ById<MExtended>
  temps: MExtended[]
  tempIds: Id[]
  clonesById: ById<MExtended>
  clones: MExtended[]
  cloneIds: Id[]
  clone(item: MExtended, data?: Partial<M>, options?: CloneOptions): MExtended
  commit(item: MExtended, data?: Partial<M>): MExtended
  reset(item: MExtended, data?: Partial<M>, options?: CloneOptions): MExtended
  clearAll(): void
}
