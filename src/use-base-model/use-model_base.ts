import type { BaseModelData, ModelFnType, ModelFnTypeExtended } from '../use-base-model/types'
import type { AnyData } from '../use-service'

import { useModelStorage } from './use-model_storage'
import { useModelEvents } from './use-model_events'

/**
 * Enables Model cloning and events on the provided ModelFn
 * @param ModelFn
 * @returns wrapped ModelFn
 */
export const useModelBase = <
  M extends AnyData,
  N extends Partial<M & BaseModelData> = Partial<M & BaseModelData>,
  F extends ModelFnType<M> = ModelFnType<M>,
>(
  ModelFn: F,
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

  const CloneModel = useModelStorage<N, ModelFnTypeExtended<N>>(fn)
  const EventModel = useModelEvents(CloneModel)
  return EventModel as any as ModelFnTypeExtended<M>
}
