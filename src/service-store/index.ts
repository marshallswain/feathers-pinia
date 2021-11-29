import { ServiceOptions } from './types'
import { makeState } from './make-state'
import { makeGetters } from './make-getters'
import { makeActions } from './make-actions'
import { BaseModel } from './base-model'

export { makeState, makeGetters, makeActions, BaseModel }

export function makeServiceStore(options: ServiceOptions) {
  return {
    id: options.id,
    state: makeState(options),
    getters: makeGetters(options),
    actions: makeActions(options),
  }
}
