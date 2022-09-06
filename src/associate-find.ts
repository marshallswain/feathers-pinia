import type { ModelStatic } from './service-store/types'
import { BaseModel } from './service-store/base-model'
import { Params } from './types'
import { getParams, setupAssociation } from './associate-utils'

interface AssociateFindOptions<M extends BaseModel> {
  Model: ModelStatic<BaseModel>
  makeParams: (instance: M) => Params
  handleSetInstance?: (this: M, associatedRecord: M) => void
}
export function associateFind<M extends BaseModel>(
  instance: M,
  prop: string,
  { Model, makeParams, handleSetInstance }: AssociateFindOptions<M>,
) {
  // Cache the initial data in a variable
  const initialData = (instance as any)[prop]

  const { _handleSetInstance, propUtilName } = setupAssociation(instance, handleSetInstance, prop, Model, 'find')

  Object.defineProperty(instance, prop, {
    // Define the key as non-enumerable so it won't get cloned
    enumerable: false,

    // Reading values will populate them from data in the store that matches the params.
    get() {
      const params = getParams(this, makeParams)
      params.temps = true
      return Model.findInStore(params).data
    },

    // Writing values to the setter will write them to the other Model's store.
    set(this: M, items: any[]) {
      items
        .map((i) => {
          return new Model(i).addToStore()
        })
        .map((i) => {
          return _handleSetInstance.call(this, i as any)
        })
    },
  })

  // Create the `findProp` utility on instance.Model
  Object.defineProperty(instance, propUtilName, {
    value: () => {
      const params = getParams(instance, makeParams)
      return Model.find(params)
    },
  })

  // Write the initial data to the new setter
  if (initialData) {
    (instance as any)[prop] = initialData
  }
}
