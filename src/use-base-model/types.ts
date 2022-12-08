import type { AnyData } from '../use-service'

export type BaseModelData = {
  /**
   * Set to `true` to mark this instance as a clone
   */
  __isClone?: boolean
}

export type WithModel<M extends AnyData> = {
  /**
   * The model function.
   */
  readonly __Model: ModelFnTypeExtended<M>
}

export type BaseModelProps<M extends AnyData = AnyData, TempId extends string = '__tempId'> = {
  clone(this: M): M
  commit(this: M): M
  reset(this: M): M
  /**
   * the name of the Model function
   */
  readonly __modelName: string
  /**
   * Will be `true` if this instance is a clone
   */
  readonly __isClone: boolean
  /**
   * the attribute on the data holding the id property
   */
  readonly __idField: string
  /**
   * the attribute on the data holding the tempId property
   */
  readonly __tempIdField: string
} & {
  [key in TempId]?: string
} & WithModel<M>

export type ModelFnType<M extends AnyData, TempId extends string = '__tempId'> = {
  (data: Partial<M & BaseModelData>): M & BaseModelProps<M, TempId>
}
export type ModelFnTypeExtended<M extends AnyData, TempId extends string = '__tempId'> = {
  (data: Partial<M & BaseModelData>): M & BaseModelProps<M, TempId>
  clone: (data: M) => M
}

export type BaseModelFn<M extends AnyData> = (data: Partial<M>) => Partial<M> & BaseModelProps<M>
export type BaseModelSetupFn<M extends AnyData> = (
  data: Partial<M> & BaseModelProps<M>,
) => Partial<M> & BaseModelProps<M>

export interface ServiceOrStoreMethods {
  create: any
  patch: any
  remove: any
}
