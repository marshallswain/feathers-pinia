import { ServiceActions, ServiceGetters, ServiceOptions, ServiceState } from './types'
import { makeState } from './make-state'
import { makeGetters } from './make-getters'
import { makeActions } from './make-actions'
import { BaseModel } from './base-model'
import { DefineStoreOptions } from 'pinia'

export { makeState, makeGetters, makeActions, BaseModel }

export function makeServiceStore(
  options: ServiceOptions
  ): DefineStoreOptions<string, ServiceState, ServiceGetters, ServiceActions> {
  return {
    id: options.storeId,
    state: makeState(options),
    getters: makeGetters(options),
    actions: makeActions(options),
  };
}
