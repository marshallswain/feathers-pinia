import fastCopy from 'fast-copy'
import { AnyData } from '../use-service'
import { _ } from '@feathersjs/commons'
import { BaseModelData, BaseModelInstanceProps } from './types'

export const useInstanceDefaults = <
  M extends AnyData,
  N extends Partial<M & BaseModelData> & BaseModelInstanceProps<M> = Partial<M & BaseModelData> &
    BaseModelInstanceProps<M>,
  D extends AnyData = AnyData,
>(
  defaults: D,
  data: N,
) => {
  const dataKeys = Object.keys(data)
  const defaultsToApply = _.omit(defaults, ...dataKeys)
  const cloned = Object.assign(data, fastCopy(defaultsToApply)) as D & N

  return cloned
}
