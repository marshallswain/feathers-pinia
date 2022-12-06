import type { AnyData } from '../use-service'

export type BaseModelData = {
  /**
   * Set to `true` to mark this instance as a clone
   */
  __isClone?: boolean
}

export type BaseModelProps<M extends AnyData = AnyData, TempId extends string = '__tempId'> = {
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
  /**
   * The model function. We have to
   */
  readonly __Model: ModelFnTypeExtended<M>
} & {
  [key in TempId]?: string
}

export type ModelFnType<M extends AnyData> = {
  (data: Partial<M & BaseModelData>): M & BaseModelProps<M>
}
export type ModelFnTypeExtended<M extends AnyData> = {
  (data: Partial<M & BaseModelData>): M & BaseModelProps<M>
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
