import fastCopy from 'fast-copy'
import { _ } from '@feathersjs/commons'
import type { AnyData } from '../types.js'

export function useInstanceDefaults<D extends AnyData, M extends AnyData>(defaults: D, data: M) {
  const dataKeys = Object.keys(data)
  const defaultsToApply = _.omit(defaults, ...dataKeys) as D
  const cloned = Object.assign(data, fastCopy(defaultsToApply))

  return cloned
}
