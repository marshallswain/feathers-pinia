import type { BaseModelProps } from './types'
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
): M & BaseModelProps<M, TempId> => {
  const { name, idField, tempIdField = '__tempId' } = options
  const __isClone = data.__isClone || false

  const _data = data as M & BaseModelProps<M, TempId>
  defineBaseModelProps({
    data: _data,
    name,
    isClone: __isClone,
    idField,
    tempIdField,
  })

  const newData = reactive(_data)
  return newData
}

interface DefineBaseModelPropsOptions<M extends AnyData> {
  data: M
  name: string
  isClone: boolean
  idField: string
  tempIdField: string
}

export const defineBaseModelProps = <M extends AnyData>({
  data,
  name,
  isClone,
  idField,
  tempIdField,
}: DefineBaseModelPropsOptions<M>) => {
  Object.defineProperties(data, {
    __modelName: {
      enumerable: false,
      configurable: true,
      value: name,
    },
    __isClone: {
      enumerable: false,
      configurable: true,
      value: isClone,
    },
    __idField: {
      enumerable: false,
      configurable: true,
      value: idField,
    },
    __tempIdField: {
      enumerable: false,
      configurable: true,
      value: tempIdField,
    },
    [tempIdField]: {
      enumerable: false,
      configurable: true,
      value: data[idField] == null ? new ObjectID().toString() : undefined,
    },
  })
  return data
}
