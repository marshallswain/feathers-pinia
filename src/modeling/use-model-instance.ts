import type { CloneOptions } from '../use-data-store'
import type { AnyData } from '../types'
import type { BaseModelData, BaseModelInstanceProps, ModelInstanceData } from './types'
import ObjectID from 'isomorphic-mongo-objectid'
import { defineProperties } from '../utils/define-properties'

interface UseModelInstanceOptions {
  store: any
  setupInstance: any
}

export const useModelInstance = <M extends AnyData>(data: ModelInstanceData<M>, options: UseModelInstanceOptions) => {
  const { store, setupInstance } = options
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
  const asBaseModel = defineProperties(data, {
    __isClone,
    __idField: store.idField,
    __tempId:
      data[store.idField] == null && data.__tempId == null ? new ObjectID().toString() : data.__tempId || undefined,
    hasClone(this: M) {
      const id = this[this.__idField] || this.__tempId
      const item = store.clonesById[id]
      return item ? setupInstance(item) : null
    },
    clone(this: M, data: Partial<M> = {}, options: CloneOptions = {}) {
      const item = store.clone(this, data, options)
      return setupInstance(item)
    },
    commit(this: M, data: Partial<M> = {}) {
      const item = store.commit(this, data, options)
      return setupInstance(item)
    },
    reset(this: M, data: Partial<M> = {}) {
      const item = store.reset(this, data, options)
      return setupInstance(item)
    },
    addToStore(this: M) {
      const item = store.addToStore(this)
      return setupInstance(item)
    },
    removeFromStore(this: M) {
      const item = store.removeFromStore(this)
      return setupInstance(item)
    },
  }) as M & BaseModelData & BaseModelInstanceProps<M>

  return asBaseModel
}
