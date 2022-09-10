import type { Association, BaseModelAssociations, ModelStatic } from './service-store/types'
import { BaseModel } from './service-store'
import { getAnyId } from './utils'

export type HandleSetInstance<M> = (this: M, associatedRecord: M) => void

export function getParams(instance: any, makeParams: any) {
  if (!makeParams) return {}
  const { tempIdField, idField } = instance.Model
  const id = getAnyId(instance, tempIdField, idField)
  // I don't know if reactivity works from inside the instance, so I'm getting it from the store just in case.
  const itemInStore = instance.Model.getFromStore(id)
  // If the record wasn't added to the store, use the original, non-reactive one.
  const params = makeParams(itemInStore || instance)
  return params
}

function defaultHandleSetInstance<M>(associatedRecord: M) {
  return associatedRecord
}

export function setupAssociation<M extends BaseModel>(
  instance: M,
  handleSetInstance: any,
  prop: string,
  Model: ModelStatic<BaseModel>,
  propUtilsPrefix: string,
) {
  // Define the association
  const def: Association = { name: prop, Model, type: 'get' }

  const _handleSetInstance = handleSetInstance || defaultHandleSetInstance

  // Register the association on the instance.Model
  if (!instance.Model.associations[prop]) {
    (instance.Model.associations as BaseModelAssociations)[prop] = def
  }

  // prefix the prop name with the `propUtilsPrefix`, which is `_`, by default.
  const propUtilName = `${propUtilsPrefix}${prop}`

  return { _handleSetInstance, propUtilName }
}
