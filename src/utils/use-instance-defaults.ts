import fastCopy from 'fast-copy'
import { AnyData } from '../types.js'
import { _ } from '@feathersjs/commons'

export const useInstanceDefaults = <D extends AnyData, M extends AnyData>(defaults: D, data: M) => {
  const dataKeys = Object.keys(data)
  const defaultsToApply = _.omit(defaults, ...dataKeys) as D
  const cloned = Object.assign(data, fastCopy(defaultsToApply))

  return cloned
}
