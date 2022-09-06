import type { ModelStatic } from './service-store/types'
import type { HandleSetInstance } from './associate-utils'
import type { Params } from './types'
import type { Id } from '@feathersjs/feathers'
import { BaseModel } from './service-store/base-model'
import { getParams, setupAssociation } from './associate-utils'

interface AssociateGetOptions<M extends BaseModel> {
  Model: ModelStatic<BaseModel>
  getId: (instance: M) => Id
  makeParams?: (instance: M) => Params
  handleSetInstance?: HandleSetInstance<M>
}
export function associateGet<M extends BaseModel>(
  instance: M,
  prop: string,
  { Model, getId, makeParams, handleSetInstance }: AssociateGetOptions<M>,
) {
  // Cache the initial data in a variable
  const initialData = (instance as any)[prop]

  const { _handleSetInstance, propUtilName } = setupAssociation(instance, handleSetInstance, prop, Model, 'get')

  Object.defineProperty(instance, prop, {
    // Define the key as non-enumerable so it won't get cloned
    enumerable: false,

    // Reading values will populate them from data in the store that matches the params.
    get() {
      const id = getId(this)
      const params = getParams(this, makeParams)
      params.temps = true
      return Model.getFromStore(id, params)
    },

    // Writing a value to the setter will write it to the other Model's store.
    set(this: M, item: any[]) {
      const model = new Model(item).addToStore()
      return _handleSetInstance.call(this, model as any)
    },
  })

  // Create the `getProp` utility on instance.Model
  Object.defineProperty(instance, propUtilName, {
    value: () => {
      const id = getId(instance)
      const params = getParams(instance, makeParams)
      return Model.get(id, params)
    },
  })

  // Write the initial data to the new setter
  if (initialData) {
    (instance as any)[prop] = initialData
  }
}
