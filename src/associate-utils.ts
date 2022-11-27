import type {
  Association,
  BaseModelAssociations,
  FindClassParams,
  FindClassParamsStandalone,
  ModelStatic,
  ServiceStoreDefault,
} from './service-store/types'
import { BaseModel } from './service-store'

export type HandleSetInstance<M> = (this: M, associatedRecord: M) => void

export function getParams<M extends BaseModel>(
  instance: any,
  store: ServiceStoreDefault<M>,
  makeParams?: (instance: M) => FindClassParams,
): FindClassParamsStandalone<M> | void {
  if (makeParams) {
    const params = makeParams(instance)
    if (params.temps !== false) params.temps = true
    const _params = Object.assign({}, params, { store })
    return _params
  }
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
    const _associations = instance.Model.associations as BaseModelAssociations
    _associations[prop] = def
  }

  // prefix the prop name with the `propUtilsPrefix`, which is `_`, by default.
  const propUtilName = `${propUtilsPrefix}${prop}`

  return { _handleSetInstance, propUtilName }
}
