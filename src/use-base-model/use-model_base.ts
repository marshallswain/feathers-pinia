import type { BaseModelData, ModelFnType, ModelFnTypeExtended } from '../use-base-model/types'
import type { AnyData } from '../use-service'

import { useModelClones } from './use-model_clones'
import { useModelEvents } from './use-model_events'

/**
 * Enables Model cloning and events on the provided ModelFn
 * @param ModelFn
 * @returns wrapped ModelFn
 */
export const useModelBase = <
  M extends AnyData,
  TempId extends string = '__tempId',
  N extends Partial<M & BaseModelData> = Partial<M & BaseModelData>,
  F extends ModelFnType<M> = ModelFnType<M, TempId>,
>(
  ModelFn: F,
) => {
  // adds `item.__Model` so it's available in the ModelFn.
  const fn = ((data: N) => {
    Object.defineProperty(data, '__Model', {
      configurable: true,
      enumerable: false,
      value: ModelFn,
    })
    return ModelFn(data)
  }) as any as ModelFnTypeExtended<N>

  const CloneModel = useModelClones<N, ModelFnTypeExtended<N, TempId>>(fn)
  const EventModel = useModelEvents(CloneModel)
  return EventModel as any as F & ModelFnTypeExtended<M, TempId>
}
