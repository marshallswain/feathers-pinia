import type { Association, BaseModelAssociations, ModelStatic } from './service-store/types'
import { BaseModel } from './service-store/base-model'
import { Params } from './types'
import { getAnyId } from './utils'

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

  // Define the association
  const def: Association = {
    name: prop,
    Model,
    type: 'find',
  }

  function defaultHandleSetInstance(associatedRecord: M) {
    return associatedRecord
  }
  const _handleSetInstance = handleSetInstance || defaultHandleSetInstance

  // Register the association on the instance.Model
  if (!instance.Model.associations[prop]) {
    (instance.Model.associations as BaseModelAssociations)[prop] = def
  }

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

  // name the utility to be able to query more data. eg. user.findMessages
  const findPropUtilName = `find${prop.slice(0, 1).toUpperCase()}${prop.slice(1)}`

  // Create the `findProp` utility on instance.Model
  Object.defineProperty(instance, findPropUtilName, {
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

function getParams(instance: any, makeParams: any) {
  const { tempIdField, idField } = instance.Model
  const id = getAnyId(instance, tempIdField, idField)
  // I don't know if reactivity works from inside the instance, so I'm getting it from the store just in case.
  const itemInStore = instance.Model.getFromStore(id)
  // If the record wasn't added to the store, use the original, non-reactive one.
  const params = makeParams(itemInStore || instance)
  return params
}
