import type {
  FeathersInstanceProps,
  FeathersModelStatic,
  InferReturn,
  ModelInstance,
  ModelInstanceData,
  UseFeathersModelOptions,
} from '../use-base-model/types'
import type { AnyData } from '../use-service'
import { useModelEvents } from './wrap-model_events'
import { useModelInstance } from './use-model-instance'
import { useFeathersInstance } from './use-feathers-instance'
import EventEmitter from 'events'
import { wrapModelFeathers } from './wrap-model_feathers'

/**
 * Enables Model cloning and events on the provided ModelFn
 * @param ModelFn
 * @returns wrapped ModelFn
 */
export const useFeathersModel = <
  M extends AnyData,
  D extends AnyData,
  Q extends AnyData,
  ModelFunc extends (data: ModelInstance<M>) => any,
>(
  options: UseFeathersModelOptions,
  ModelFn: ModelFunc,
): {
  (data: ModelInstanceData<M>): InferReturn<ModelFunc> & FeathersInstanceProps<M, Q>
} & EventEmitter &
  FeathersModelStatic<M, D, Q, ModelFunc> => {
  // Wrapper function adds BaseModel props to instance data
  const fn = (data: ModelInstanceData<M>) => {
    const _data = data as typeof data & { __Model: typeof fn }
    Object.defineProperty(_data, '__Model', {
      configurable: true,
      enumerable: false,
      value: fn,
    })
    const asModelInstance = useModelInstance<M>(_data, options)
    const asFeathersInstance = useFeathersInstance({ service: options.service }, asModelInstance)
    return ModelFn(asFeathersInstance)
  }

  // const WrappedBaseModel = wrapModelBase<M, Q, typeof fn>(options, fn)
  const WrappedFeathersModel = wrapModelFeathers<M, D, Q, typeof fn>(options, fn)
  const WrappedEventModel = useModelEvents(WrappedFeathersModel)

  return WrappedEventModel as ModelFunc & typeof fn & FeathersModelStatic<M, D, Q, any> & EventEmitter
}
