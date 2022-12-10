import type { InferReturn, ModelInstance, ModelInstanceData, UseBaseModelOptions } from '../use-base-model/types'
import type { AnyData } from '../use-service'
// import { useModelEvents } from './wrap-model_events'
import { wrapModelBase } from './wrap-model_base'
import { useModelInstance } from './use-model-instance'

/**
 * Enables Model cloning and events on the provided ModelFn
 * @param ModelFn
 * @returns wrapped ModelFn
 */
export const useBaseModel = <M extends AnyData, Func extends (data: ModelInstance<M>) => any>(
  options: UseBaseModelOptions,
  ModelFn: Func,
  // SEE IF I CAN GET wrappedBaseModel TO EXTEND THIS RETURN TYPE
): {
  (data: ModelInstanceData<M>): InferReturn<Func>
  test: boolean
} => {
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
  // return fn as {
  //   (data: ModelInstance<M>): InferReturn<Func>
  //   test: boolean
  // }

  const WrappedBaseModel = wrapModelBase<M, typeof fn>(options, fn)
  // const WrappedEventModel = useModelEvents(WrappedBaseModel)
  return WrappedBaseModel as typeof fn & { test: boolean }
}
// as (data: ModelInstance<M>) => ModelInstance<M> & BaseModelInstanceProps<M>

// type InferArgs<T> = T extends (...t: [...infer Arg]) => any ? Arg : never
// type AnyFn = (...args: any[]) => any

// function getWrapper<TFunc extends (...args: any[]) => any>(
//   func: TFunc,
// ): (...args: InferArgs<TFunc>) => InferReturn<TFunc> {
//   return (...args: InferArgs<TFunc>) => {
//     // something before

//     return func(...args)
//   }
// }

// const Test = getWrapper((options: { foo: string }) => {
//   return 'blue' + options.foo
// })

// const test = Test({ foo: 'blue' })
