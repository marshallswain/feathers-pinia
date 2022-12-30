import type { BaseModelData, BaseModelInstanceProps, ModelInstanceData, WithModel } from './types'
import type { AnyData, CloneOptions } from '../use-service'
import { reactive } from 'vue-demi'
import ObjectID from 'isomorphic-mongo-objectid'
import { defineProperties } from './utils'

interface UseModelInstanceOptions {
  name: string
  idField: string
}

export const useModelInstance = <M extends AnyData>(data: ModelInstanceData<M>, options: UseModelInstanceOptions) => {
  const { name, idField } = options
  const __isClone = data.__isClone || false

  // The `__Model` property was added by the `useModelBase` wrapper in `use-model-base.ts`.
  const _data = data as M & WithModel<M>

  // instance.__isTemp
  Object.defineProperty(_data, '__isTemp', {
    configurable: true,
    enumerable: false,
    get() {
      return this[this.__idField] == null
    },
  })

  // setup baseModel properties
  const asBaseModel = defineProperties(_data, {
    __modelName: name,
    __isClone,
    __idField: idField,
    __tempId: data[idField] == null && data.__tempId == null ? new ObjectID().toString() : data.__tempId || undefined,
    clone(this: M, data: Partial<M> = {}, options: CloneOptions = {}) {
      return this.__Model.store.clone(this, data, options)
    },
    commit(this: M, data: Partial<M> = {}) {
      return this.__Model.store.commit(this, data, options)
    },
    reset(this: M, data: Partial<M> = {}) {
      return this.__Model.store.reset(this, data, options)
    },
    addToStore(this: M) {
      return this.__Model.addToStore(this)
    },
    removeFromStore(this: M) {
      return this.__Model.removeFromStore(this)
    },
  }) as M & BaseModelData & BaseModelInstanceProps<M>

  // make the data reactive, but ignore the proxy "Reactive" wrapper type to keep internal types simpler.
  const newData = reactive(asBaseModel) as typeof asBaseModel
  return newData
}
