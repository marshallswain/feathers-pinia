import type { Association, BaseModelAssociations } from './service-store/new-types'
import { AnyData } from './use-service'
import { ModelInstance } from './use-base-model'
import {
  UseFindParams,
  // UseFindParamsStandalone
} from './use-find'

export type HandleSetInstance<M> = (this: M, associatedRecord: M) => void

export function getParams<
  M extends AnyData,
  // D extends AnyData,
  // Q extends AnyData,
  // ModelFunc extends (data: ModelInstance<M>) => any,
>(instance: M, store: any, makeParams: (instance: M) => UseFindParams) {
  const params = makeParams(instance)
  if (params.temps !== false) params.temps = true
  const _params = Object.assign({}, params, { store })
  return _params
}

export function setupAssociation<
  M extends AnyData,
  RM extends AnyData,
  ModelFunc extends (data: ModelInstance<RM>) => any,
>(instance: M, prop: string, Model: ModelFunc, propUtilsPrefix: string) {
  // Define the association
  const def: Association<RM> = { name: prop, Model, type: 'get' }

  // Register the association on the instance.Model
  if (!instance.__Model.associations[prop]) {
    const _associations = instance.__Model.associations as BaseModelAssociations<RM>
    _associations[prop] = def
  }

  // prefix the prop name with the `propUtilsPrefix`, which is `_`, by default.
  const propUtilName = `${propUtilsPrefix}${prop}`

  return { propUtilName }
}
