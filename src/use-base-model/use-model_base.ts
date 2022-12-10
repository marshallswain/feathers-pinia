import type { BaseModelData, BaseModelInstanceProps, ModelFnTypeExtended } from '../use-base-model/types'
import type { AnyData } from '../use-service'
// import { useModelEvents } from './wrap-model_events'
import { wrapModelBase } from './wrap-model_base'
import { useModelInstance } from './use-model-instance'

export interface UseBaseModelOptions {
  name: string
  idField: string
}

/**
 * Enables Model cloning and events on the provided ModelFn
 * @param ModelFn
 * @returns wrapped ModelFn
 */
export const useBaseModel = <M extends AnyData, F extends ModelFnTypeExtended<M> = ModelFnTypeExtended<M>>(
  options: UseBaseModelOptions,
  ModelFn: F,
) => {
  // adds `item.__Model` so it's available in the ModelFn.
  const fn = (data: Partial<M & BaseModelData>) => {
    Object.defineProperty(data, '__Model', {
      configurable: true,
      enumerable: false,
      value: fn,
    })
    const asModel = useModelInstance<M>(data, { name: 'Task', idField: '_id' })
    return ModelFn(asModel)
  }

  const WrappedBaseModel = wrapModelBase<M>(fn)
  // const WrappedEventModel = useModelEvents(WrappedBaseModel)
  return WrappedBaseModel as (
    data: Partial<M & BaseModelData>,
  ) => Partial<M & BaseModelData> & BaseModelInstanceProps<M>
}
