import type { BaseModelData, ModelFnType, ModelFnTypeExtended } from './types'
import type { AnyData, UseServiceOptions } from '../use-service'

import { wrapModelFeathers } from './wrap-model_feathers'
import { useModelEvents } from './wrap-model_events'

/**
 * Enables Model cloning and events on the provided ModelFn
 * @param ModelFn
 * @returns wrapped ModelFn
 */
export const useFeathersModel = <
  M extends AnyData,
  N extends Partial<M & BaseModelData> = Partial<M & BaseModelData>,
  F extends ModelFnType<M> = ModelFnType<M>,
>(
  ModelFn: F,
  options: UseServiceOptions<N>,
) => {
  // adds `item.__Model` so it's available in the ModelFn.
  const fn = ((data: N) => {
    Object.defineProperty(data, '__Model', {
      configurable: true,
      enumerable: false,
      value: fn,
    })
    return ModelFn(data)
  }) as any as ModelFnTypeExtended<N>

  const StoreModel = wrapModelFeathers<N, ModelFnTypeExtended<N>>(fn, options)
  const EventModel = useModelEvents(StoreModel)
  return EventModel as any as ModelFnTypeExtended<M>
}
