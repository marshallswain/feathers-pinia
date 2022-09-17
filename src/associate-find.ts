import type { FindClassParams, FindClassParamsStandalone, ModelStatic } from './service-store/types'
import { BaseModel } from './service-store/base-model'
import { getParams, setupAssociation } from './associate-utils'
import { Find } from './use-find'
import { ref } from 'vue'

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
  // Cache the initial data in a variable
  const initialData = (instance as any)[prop]
  const { _handleSetInstance, propUtilName } = setupAssociation(
    instance,
    handleSetInstance,
    prop,
    Model,
    propUtilsPrefix,
  )

  let _utils: Find<M>

  function setupFind(instance: M) {
    if (!makeParams) return null
    const _params = getParams(instance, Model.store as any, makeParams)
    _utils = new Find(_params as FindClassParamsStandalone<M>)
  }

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
    (instance as any)[prop] = initialData
  }
}
