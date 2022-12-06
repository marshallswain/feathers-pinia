import type { ModelFnType, ModelFnTypeExtended } from '../use-base-model/types'
import type { AnyData } from '../use-service'

import { useModelClones } from './use-model_clones'
import { useModelEvents } from './use-model_events'

/**
 * Enables Model cloning and events on the provided ModelFn
 * @param ModelFn
 * @returns wrapped ModelFn
 */
export const useModelBase = <M extends AnyData, F extends ModelFnType<M>>(ModelFn: F) => {
  // adds `item.__Model`
  const fn = ((data: any) => {
    Object.defineProperty(data, '__Model', {
      configurable: true,
      enumerable: false,
      value: ModelFn,
    })
    return ModelFn(data)
  }) as any as ModelFnTypeExtended<M>

  const CloneModel = useModelClones<M, ModelFnTypeExtended<M>>(fn)
  const EventModel = useModelEvents(CloneModel)
  return EventModel as any as F
}
