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
export const useBaseModel = <M extends AnyData, Func extends (...args: any[]) => any>(
  options: UseBaseModelOptions,
  ModelFn: Func,
): ((data: Partial<M & BaseModelData>) => InferReturn<Func>) => {
  // adds `item.__Model` so it's available in the ModelFn.
  // const fn = (data: Partial<M & BaseModelData>) => {
  const fn = (data: Partial<M & BaseModelData>) => {
    // const [data] = args
    Object.defineProperty(data, '__Model', {
      configurable: true,
      enumerable: false,
      value: fn,
    })
    const asModel = useModelInstance<M>(data, options)
    return ModelFn(asModel)
  }
  return fn

  // const WrappedBaseModel = wrapModelBase<M>(fn)
  // const WrappedEventModel = useModelEvents(WrappedBaseModel)
  // return WrappedBaseModel
}
// as (data: Partial<M & BaseModelData>) => Partial<M & BaseModelData> & BaseModelInstanceProps<M>

type InferArgs<T> = T extends (...t: [...infer Arg]) => any ? Arg : never
type InferReturn<T> = T extends (...t: [...infer Arg]) => infer Res ? Res : never
type AnyFn = (...args: any[]) => any

function getWrapper<TFunc extends (...args: any[]) => any>(
  func: TFunc,
): (...args: InferArgs<TFunc>) => InferReturn<TFunc> {
  return (...args: InferArgs<TFunc>) => {
    // something before

    return func(...args)
  }
}

const Test = getWrapper((options: { foo: string }) => {
  return 'blue' + options.foo
})

const test = Test({ foo: 'blue' })
