import type { BaseModelProps, WithModel } from './types'
import { reactive } from 'vue'
import { AnyData, CloneOptions } from '../use-service'
import ObjectID from 'isomorphic-mongo-objectid'

interface UseBaseModelOptions {
  name: string
  idField: string
  ModelFn?: any
}

export const useInstanceModel = <M extends AnyData>(data: M, options: UseBaseModelOptions) => {
  const { name, idField } = options
  const __isClone = data.__isClone || false

  // The `__Model` property was added by the `useModelBase` wrapper in `use-model-base.ts`.
  const _data = data as M & WithModel<M>

  // setup baseModel properties
  const asBaseModel = defineProperties(_data, {
    __modelName: name,
    __isClone,
    __idField: idField,
    __tempId: data[idField] == null && data.__tempId == null ? new ObjectID().toString() : data.__tempId || undefined,
    clone(this: M, data: Partial<M> = {}, options: CloneOptions = {}) {
      return this.__Model.clone(this, data, options)
    },
    commit(this: M, data: Partial<M> = {}) {
      return this.__Model.commit(this, data, options)
    },
    reset(this: M, data: Partial<M> = {}) {
      return this.__Model.reset(this, data, options)
    },
    addToStore(this: M) {
      return this.__Model.addToStore(this)
    },
    removeFromStore(this: M) {
      return this.__Model.removeFromStore(this)
    },
  }) as M & BaseModelProps<M>

  // make the data reactive, but ignore the proxy "Reactive" wrapper type to keep internal types simpler.
  const newData = reactive(asBaseModel) as typeof asBaseModel
  return newData
}

/**
 * Defines all provided properties as non-enumerable and configurable
 */
const defineProperties = <M extends AnyData, D extends AnyData>(data: M, properties: D) => {
  Object.keys(properties).forEach((key) => {
    Object.defineProperty(data, key, {
      enumerable: false,
      configurable: true,
      value: properties[key],
    })
  })
  return data
}
