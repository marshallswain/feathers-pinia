import { MakeStateOptions, ServiceStoreDefaultState } from './types'
import { StateTree } from 'pinia'
import { defaultSharedState } from './define-store'
import { BaseModel } from './base-model'

export function makeState<
  M extends BaseModel = BaseModel,
  S extends StateTree = {}
>(
  options?: MakeStateOptions<M, S>
): () => ServiceStoreDefaultState & S {
  const defaultState: ServiceStoreDefaultState<M> = {
    clientAlias: options?.clientAlias || defaultSharedState.clientAlias,
    servicePath: options?.servicePath || defaultSharedState.servicePath,
    idField: options?.idField || defaultSharedState.idField,
    tempIdField: options?.tempIdField || defaultSharedState.tempIdField,
    itemsById: {},
    tempsById: {},
    clonesById: {},
    pendingById: {
      Model: {
        find: false,
        count: false,
        get: false
      },
    },
    eventLocksById: {
      created: {},
      patched: {},
      updated: {},
      removed: {},
    },
    pagination: {},
    whitelist: options?.whitelist || defaultSharedState.whitelist,
    paramsForServer: options?.paramsForServer || defaultSharedState.paramsForServer,
    skipRequestIfExists: options?.skipRequestIfExists || defaultSharedState.skipRequestIfExists
  }
  const state = options?.state?.()
  return () => Object.assign(defaultState, state)
}
