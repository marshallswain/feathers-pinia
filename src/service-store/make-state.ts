import { MakeStateOptions, ServiceStoreDefaultState } from './types'
import { StateTree } from 'pinia'
import { BaseModel } from './base-model'

export function makeState<M extends BaseModel = BaseModel, S extends StateTree = {}>(
  options: MakeStateOptions<M, S>,
): () => ServiceStoreDefaultState & S {
  const defaultState: ServiceStoreDefaultState<M> = {
    clientAlias: options.clientAlias,
    servicePath: options.servicePath,
    idField: options.idField,
    tempIdField: options.tempIdField,
    itemsById: {},
    tempsById: {},
    clonesById: {},
    pendingById: {
      Model: {
        find: false,
        count: false,
        get: false,
      },
    },
    eventLocksById: {
      created: {},
      patched: {},
      updated: {},
      removed: {},
    },
    pagination: {},
    whitelist: options.whitelist,
    paramsForServer: options.paramsForServer,
    skipRequestIfExists: options.skipRequestIfExists,
  }
  const state = options.state()
  return () => Object.assign(defaultState, state)
}
