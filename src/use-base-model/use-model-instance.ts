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

  const _data = data as M & WithModel<M>

  const asBaseModel = defineBaseModelProps({
    data: _data,
    name,
    isClone: __isClone,
    idField,
    tempIdField,
  })

  const newData = reactive(asBaseModel) as typeof asBaseModel
  return newData
}

interface DefineBaseModelPropsOptions<M extends AnyData> {
  data: M & WithModel<M>
  name: string
  isClone: boolean
  idField: string
  tempIdField: string
}

export const defineBaseModelProps = <M extends AnyData, TempId extends string>({
  data,
  name,
  isClone,
  idField,
  tempIdField,
}: DefineBaseModelPropsOptions<M>) => {
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

  defineProperties(data, {
    __modelName: name,
    __isClone: isClone,
    __idField: idField,
    __tempIdField: tempIdField,
    [tempIdField]: data[idField] == null ? new ObjectID().toString() : undefined,
    clone: cloneMethods.clone,
    commit: cloneMethods.commit,
    reset: cloneMethods.reset,
  })

  return data as M & BaseModelProps<M, TempId>
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
