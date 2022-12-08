import type { BaseModelProps, WithModel } from './types'
import { reactive } from 'vue'
import { AnyData } from '../use-service'
import ObjectID from 'isomorphic-mongo-objectid'

interface UseBaseModelOptions<TempId extends string = '__tempId'> {
  name: string
  idField: string
  tempIdField?: TempId
  ModelFn?: any
}

export const useInstanceModel = <M extends AnyData, TempId extends string = '__tempId'>(
  data: M,
  options: UseBaseModelOptions<TempId>,
) => {
  const { name, idField, tempIdField = '__tempId' } = options
  const __isClone = data.__isClone || false

  // The `__Model` property was added by the `useModelBase` wrapper in `use-model-base.ts`.
  const _data = data as M & WithModel<M>

  const cloneMethods = {
    clone(this: M) {
      return this
    },
    commit(this: M) {
      return this
    },
    reset(this: M) {
      return this
    },
  }

  // setup baseModel properties
  const asBaseModel = defineProperties(_data, {
    __modelName: name,
    __isClone,
    __idField: idField,
    __tempIdField: tempIdField,
    [tempIdField]: data[idField] == null ? new ObjectID().toString() : undefined,
    clone: cloneMethods.clone,
    commit: cloneMethods.commit,
    reset: cloneMethods.reset,
  }) as M & BaseModelProps<M, TempId>

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
