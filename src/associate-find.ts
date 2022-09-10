import type { ModelStatic } from './service-store/types'
import { BaseModel } from './service-store/base-model'
import { Params } from './types'
import { getParams, setupAssociation } from './associate-utils'

interface AssociateFindOptions<M extends BaseModel> {
  Model: ModelStatic<BaseModel>
  makeParams: (instance: M) => Params
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

  const utils = {
    find(params: Params) {
      const _params = getParams(instance, makeParams) || params
      return Model.find(_params)
    },
    findInStore(params: Params) {
      const _params = getParams(instance, makeParams) || params
      return Model.findInStore(_params)
    },
  }

  Object.defineProperty(instance, prop, {
    // Define the key as non-enumerable so it won't get cloned
    enumerable: false,
    get() {
      const params = getParams(this, makeParams)
      params.temps = true
      return Model.findInStore(params).data
    },
    // Writing values to the setter will write them to the other Model's store.
    set(this: M, items: any[]) {
      items.map((i) => new Model(i).addToStore()).map((i) => _handleSetInstance.call(this, i as any))
    },
  })

  // Create the `_propName` utility object
  Object.defineProperty(instance.Model.prototype, propUtilName, {
    configurable: true,
    enumerable: false,
    value: utils,
  })

  // Write the initial data to the new setter
  if (initialData) {
    (instance as any)[prop] = initialData
  }
}
