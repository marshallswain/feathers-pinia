import type {
  BaseModelStatic,
  InferReturn,
  ModelInstance,
  ModelInstanceData,
  UseBaseModelOptions,
} from '../use-base-model/types'
import type { AnyData } from '../use-service'
import { useModelEvents } from './wrap-model_events'
import { wrapModelBase } from './wrap-model_base'
import { useModelInstance } from './use-model-instance'
import EventEmitter from 'events'

/**
 * Enables Model cloning and events on the provided ModelFn
 * @param ModelFn
 * @returns wrapped ModelFn
 */
export const useBaseModel = <M extends AnyData, Q extends AnyData, Func extends (data: ModelInstance<M>) => any>(
  options: UseBaseModelOptions,
  ModelFn: Func,
): {
  (data: ModelInstanceData<M>): InferReturn<Func>
} & BaseModelStatic<M> &
  EventEmitter => {
  // adds `item.__Model` so it's available in the ModelFn.
  const fn = (data: ModelInstanceData<M>) => {
    const _data = data as typeof data & { __Model: typeof fn }
    Object.defineProperty(_data, '__Model', {
      configurable: true,
      enumerable: false,
      value: fn,
    })
    const asModel = useModelInstance<M>(_data, options)
    return ModelFn(asModel)
  }

  const WrappedBaseModel = wrapModelBase<M, Q, typeof fn>(options, fn)
  const WrappedEventModel = useModelEvents(WrappedBaseModel)
  return WrappedEventModel as typeof fn & BaseModelStatic<M> & EventEmitter
}
