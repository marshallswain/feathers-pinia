import { ServiceOptions } from './types'
import { makeState } from './make-state'
import { makeGetters } from './make-getters'
import { makeActions } from './make-actions'
import { BaseModel } from './base-model'
import { StateTree, _GettersTree } from 'pinia'

export { makeState, makeGetters, makeActions, BaseModel }

export function makeServiceStore<
  Id extends string,
  M extends BaseModel = BaseModel,
  S extends StateTree = StateTree,
  G extends _GettersTree<S> = {},
  A = {},
>(options: ServiceOptions<Id, M, S, G, A>) {
  return {
    id: options.id,
    state: makeState(options),
    getters: makeGetters(options),
    actions: makeActions(options),
  }
}
