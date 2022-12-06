import fastCopy from 'fast-copy'
import { defineBaseModelProps } from './use-model-instance'

export const useInstanceDefaults = <M, D>(defaults: D, data: M) => {
  const _data: any = data
  const cloned: any = Object.assign({}, fastCopy(defaults), data)
  // re-init baseModel since non-enumerables get wiped out
  const baseModel = defineBaseModelProps({
    data: cloned,
    name: _data.__modelName,
    isClone: _data.__isClone,
    idField: _data.__idField,
    tempIdField: _data.__tempIdField,
  })
  return baseModel as D & M
}
