import type { FindClassParams, FindClassParamsStandalone, AssociateFindUtils, ModelStatic } from './service-store/types'
import { BaseModel } from './service-store/base-model'
import { getParams, setupAssociation } from './associate-utils'
import { Find, useFind } from './use-find'
import { MaybeRef } from './utility-types'

interface AssociateFindOptions<M extends BaseModel> {
  Model: ModelStatic<BaseModel>
  makeParams: (instance: M) => FindClassParams
  handleSetInstance?: (this: M, associatedRecord: M) => void
  propUtilsPrefix?: string
}
export function associateFind<M extends BaseModel>(
  instance: M,
  prop: string,
  { Model, makeParams, handleSetInstance, propUtilsPrefix = '_' }: AssociateFindOptions<M>,
) {
  // cache the initial data in a variable
  const initialData = (instance as any)[prop]
  const { _handleSetInstance, propUtilName } = setupAssociation(
    instance,
    handleSetInstance,
    prop,
    Model,
    propUtilsPrefix,
  )

  // define `setupFind` for lazy creation of associated getters.
  let _utils: AssociateFindUtils<M>
  function setupFind(instance: M) {
    if (!makeParams) return null
    const _params = getParams(instance, Model.store as any, makeParams)
    _utils = new Find(_params as FindClassParamsStandalone<M>) as any
    _utils.useFind = (params: MaybeRef<FindClassParams>): Find<M> => {
      const _params = params.value || params
      _params.store = Model.store
      return useFind(params as MaybeRef<FindClassParamsStandalone<M>>)
    }
  }

  // create the `propName` where the data is found.
  Object.defineProperty(instance, prop, {
    enumerable: false,
    get() {
      if (!_utils) setupFind(this)
      return _utils.data.value
    },
    // Writing values to the setter will write them to the other Model's store.
    set(this: M, items: any[]) {
      items.map((i) => new Model(i).addToStore()).map((i) => _handleSetInstance.call(this, i as any))
    },
  })

  // Create the `_propName` utility object
  Object.defineProperty(instance, propUtilName, {
    enumerable: false,
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
}
