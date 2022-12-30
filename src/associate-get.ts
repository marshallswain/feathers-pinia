import type { NullableId } from '@feathersjs/feathers'
import type { AnyData } from './use-service'
import type { FeathersInstance, ModelInstance } from './use-base-model'
import type { UseFindParams } from './use-find'
import { getParams, setupAssociation } from './associate-utils'
import { useGet } from './use-get'
import { UnwrapNestedRefs } from 'vue-demi'

interface AssociateGetOptions<
  M extends ModelInstance<AnyData>,
  RM extends AnyData,
  ModelFunc extends (data: ModelInstance<RM>) => any,
> {
  Model: ModelFunc
  getId: (instance: M) => NullableId
  makeParams?: (instance: M) => UseFindParams
  handleSetInstance?: (this: M, associatedRecord: RM) => void
  propUtilsPrefix?: string
}
export function associateGet<
  M extends ModelInstance<AnyData>,
  Prop extends string,
  RM extends AnyData,
  ModelFunc extends (data: ModelInstance<RM>) => any,
  DunderProp extends string = `_${Prop}`,
>(
  instance: M,
  prop: string,
  { Model, getId, makeParams, handleSetInstance, propUtilsPrefix = '_' }: AssociateGetOptions<M, RM, ModelFunc>,
) {
  const _Model: any = Model
  // Cache the initial data in a variable
  const initialData = (instance as any)[prop]

  const { propUtilName } = setupAssociation<M, RM, ModelFunc>(instance, prop, Model, propUtilsPrefix)
  const defaultHandleSet = () => null
  const _handleSetInstance = (handleSetInstance || defaultHandleSet) as (this: M, associatedRecord: RM) => void

  // Bundled useFind already includes the store param
  const useGetBundled = <
    RM extends AnyData,
    RD extends AnyData = AnyData,
    RQ extends AnyData = AnyData,
    RModelFunc extends (data: ModelInstance<RM>) => any = (data: ModelInstance<RM>) => any,
  >(
    id: NullableId,
    params: UseFindParams,
  ) => {
    const _params = (params as any).value || params
    _params.store = (_Model as any).store
    return useGet<RM, RD, RQ, RModelFunc>(id, _params)
  }

  // define `setupGet` for lazy creation of associated getters.
  let _utils: any
  // let _utils: AssociateFindUtils
  function setupGet(instance: M) {
    const _id = getId(instance)
    const _params = makeParams ? getParams(instance, _Model.store, makeParams) : { store: _Model.store }
    _utils = useGet(_id, _params)
    _utils.useGet = (_id: NullableId, params: UseFindParams) => useGetBundled(_id, params)
  }

  // create the `propName` where the data is found.
  Object.defineProperty(instance, prop, {
    enumerable: false,
    configurable: true,
    // Reading values will populate them from data in the store that matches the params.
    get() {
      const id = getId(this)
      const _params = makeParams ? getParams(this, _Model.store as any, makeParams) : undefined
      return _Model.getFromStore(id, _params)
    },
    // Writing a value to the setter will write it to the other Model's store.
    set(this: M, instance: any) {
      let item = instance
      if (!item.__modelName) {
        item = Model(item)
      }
      if (!_Model.getFromStore(item[item.__idField])) {
        item = item.addToStore()
      }
      return _handleSetInstance.call(this, item)
    },
  })

  // Create the `_propName` utility object
  Object.defineProperty(instance, propUtilName, {
    enumerable: false,
    configurable: true,
    get() {
      if (!_utils) setupGet(this)
      return _utils
    },
  })

  // Write the initial data to the new setter
  if (initialData) {
    const _instance: any = instance
    _instance[prop] = initialData
  }
  return instance as typeof instance & { [key in Prop]: Array<FeathersInstance<AnyData, AnyData>> } & {
    [key in DunderProp]: UnwrapNestedRefs<ReturnType<typeof useGet>> & {
      useFind: typeof useGetBundled
    }
  }
}
