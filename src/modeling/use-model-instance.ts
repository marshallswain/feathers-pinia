import type { CloneOptions } from '../use-data-store'
import type { AnyData, ById, Params } from '../types'
import type { BaseModelData, BaseModelInstanceProps, ModelInstanceData } from './types'
import ObjectID from 'isomorphic-mongo-objectid'
import { defineValues } from '../utils/define-properties'

interface UseModelInstanceOptions<M, Q extends AnyData> {
  idField: string
  clonesById: ById<AnyData>
  clone: (item: M, data?: {}, options?: CloneOptions) => M
  commit: (item: M, data?: Partial<M>) => M
  reset: (item: M, data?: {}) => M
  createInStore: (data: M | M[]) => M | M[]
  removeFromStore: (data: M | M[] | null, params?: Params<Q>) => M | M[] | null
}

export const useModelInstance = <M extends AnyData, Q extends AnyData>(
  data: ModelInstanceData<M>,
  options: UseModelInstanceOptions<M, Q>,
) => {
  if (data.__isBaseInstance) return data

  const { idField, clonesById, clone, commit, reset, createInStore, removeFromStore } = options
  const __isClone = data.__isClone || false

  // instance.__isTemp
  Object.defineProperty(data, '__isTemp', {
    configurable: true,
    enumerable: false,
    get() {
      return this[this.__idField] == null
    },
  })

  // BaseModel properties
  const asBaseModel = defineValues(data, {
    __isBaseInstance: true,
    __isClone,
    __idField: idField,
    __tempId: data[idField] == null && data.__tempId == null ? new ObjectID().toString() : data.__tempId || undefined,
    hasClone(this: M) {
      const id = this[this.__idField] || this.__tempId
      const item = clonesById[id]
      return item || null
    },
    clone(this: M, data: Partial<M> = {}, options: CloneOptions = {}) {
      const item = clone(this, data, options)
      return item
    },
    commit(this: M, data: Partial<M> = {}) {
      const item = commit(this, data)
      return item
    },
    reset(this: M, data: Partial<M> = {}) {
      const item = reset(this, data)
      return item
    },
    createInStore(this: M) {
      const item = createInStore(this)
      return item
    },
    removeFromStore(this: M) {
      const item = removeFromStore(this)
      return item
    },
  }) as M & BaseModelData & BaseModelInstanceProps<M>

  return asBaseModel
}
