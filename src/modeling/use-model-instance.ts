import ObjectID from 'isomorphic-mongo-objectid'
import type { Ref } from 'vue-demi'
import type { CloneOptions } from '../stores/index.js'
import type { AnyData, ById, Params } from '../types.js'
import { defineValues } from '../utils/define-properties'
import type { BaseModelData, ModelInstanceData, StoreInstanceProps } from './types.js'

interface UseModelInstanceOptions<M, Q extends AnyData> {
  idField: string
  clonesById: Ref<ById<AnyData>>
  clone: (item: M, data?: Record<string, any>, options?: CloneOptions) => M
  commit: (item: M, data?: Partial<M>) => M
  reset: (item: M, data?: Record<string, any>) => M
  createInStore: (data: M | M[]) => M | M[]
  removeFromStore: (data: M | M[] | null, params?: Params<Q>) => M | M[] | null
}

export function useModelInstance<M extends AnyData, Q extends AnyData>(data: ModelInstanceData<M>,
  options: UseModelInstanceOptions<M, Q>) {
  if (data.__isStoreInstance)
    return data

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
    __isStoreInstance: true,
    __isClone,
    __idField: idField,
    __tempId: data[idField] == null && data.__tempId == null ? new ObjectID().toString() : data.__tempId || undefined,
    hasClone(this: M) {
      const id = this[this.__idField] || this.__tempId
      const item = clonesById.value[id]
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
  }) as M & BaseModelData & StoreInstanceProps<M>

  return asBaseModel
}
