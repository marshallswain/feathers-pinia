// import type { AssociateFindUtils } from './use-service/types'
import type { AnyData } from './use-service'
import type { FeathersInstance, ModelInstance } from './use-base-model'
import { getParams, setupAssociation } from './associate-utils'
import { useFind, UseFindParams } from './use-find'
import { UnwrapNestedRefs } from 'vue'

interface AssociateFindOptions<
  M extends AnyData,
  RM extends AnyData,
  ModelFunc extends (data: ModelInstance<RM>) => any,
> {
  Model: ModelFunc
  makeParams: (instance: M) => UseFindParams
  handleSetInstance?: (this: M, associatedRecord: RM) => void
  propUtilsPrefix?: string
}

export function associateFind<
  M extends ModelInstance<AnyData>,
  Prop extends string,
  RM extends AnyData,
  // D extends AnyData,
  // Q extends AnyData,
  ModelFunc extends (data: ModelInstance<RM>) => any,
  DunderProp extends string = `_${Prop}`,
>(
  instance: M,
  prop: Prop,
  { Model, makeParams, handleSetInstance, propUtilsPrefix = '_' }: AssociateFindOptions<M, RM, ModelFunc>,
) {
  const _Model: any = Model
  // cache the initial data in a variable
  const initialData = (instance as any)[prop]
  const { propUtilName } = setupAssociation<M, RM, ModelFunc>(instance, prop, Model, propUtilsPrefix)
  const defaultHandleSet = () => null
  const _handleSetInstance = (handleSetInstance || defaultHandleSet) as (this: M, associatedRecord: RM) => void

  // Bundled useFind already includes the store param
  const useFindBundled = <
    RM extends AnyData,
    RD extends AnyData = AnyData,
    RQ extends AnyData = AnyData,
    RModelFunc extends (data: ModelInstance<RM>) => any = (data: ModelInstance<RM>) => any,
  >(
    params: UseFindParams,
  ) => {
    const _params = (params as any).value || params
    _params.store = (_Model as any).store
    return useFind<RM, RD, RQ, RModelFunc>(_params)
  }

  // define `setupFind` for lazy creation of associated getters.
  let _utils: any
  // let _utils: AssociateFindUtils
  function setupFind(instance: M) {
    if (!makeParams) return null
    const _params = getParams(instance, _Model.store, makeParams)
    _utils = useFind(_params)
    _utils.useFind = (params: UseFindParams) => useFindBundled(params)
  }

  // create the `propName` where the data is found.
  Object.defineProperty(instance, prop, {
    enumerable: false,
    configurable: true,
    get(this: M) {
      if (!_utils) setupFind(this)
      return _utils.data.value
    },
    // Writing values to the setter will write them to the other Model's store.
    set(this: M, items: any[]) {
      items
        .map((i) => {
          if (!i.__modelName) {
            i = Model(i)
          }
          if (!_Model.getFromStore(i[i.__idField])) {
            return i.addToStore()
          } else {
            return i
          }
        })
        .map((i) => _handleSetInstance.call(this, i as ReturnType<ModelFunc>))
    },
  })

  // Create the `_propName` utility object
  Object.defineProperty(instance, propUtilName, {
    enumerable: false,
    configurable: true,
    get() {
      if (!_utils) setupFind(this)
      return _utils
    },
  })

  // Write the initial data to the new setter
  if (initialData) {
    const _instance: any = instance
    _instance[prop] = initialData
  }
  return instance as typeof instance & { [key in Prop]: Array<FeathersInstance<AnyData, AnyData>> } & {
    [key in DunderProp]: UnwrapNestedRefs<ReturnType<typeof useFind>> & {
      useFind: typeof useFindBundled
    }
  }
}
