import { BaseModel } from './base-model'
import { defineStore as definePiniaStore, Pinia, StateTree, _GettersTree } from 'pinia'
import { registerModel } from '../models'
import { registerClient, clients } from '../clients'
import { enableServiceEvents } from './events'
import {
  DefineFeathersStoreOptions,
  ServiceStore,
  ServiceStoreSharedStateDefineOptions,
  ServiceStoreDefinition,
  ServiceStoreDefaultState,
} from './types'

import { makeState } from './make-state'
import { makeGetters } from './make-getters'
import { makeActions } from './make-actions'

export function defineStore<
  Id extends string,
  M extends BaseModel = BaseModel,
  S extends StateTree = {},
  G extends _GettersTree<S> = {},
  A = {},
>(_options: DefineFeathersStoreOptions<Id, M, S, G, A>): (pinia?: Pinia) => ServiceStore<Id, M, S, G, A> {
  const options = makeOptions<Id, M, S, G, A>(_options)

  const {
    servicePath,
    idField,
    tempIdField,
    handleEvents,
    debounceEventsTime,
    debounceEventsGuarantee,
    clientAlias,
    Model,
  } = options
  let isInitialized = false

  Object.keys(options.clients || {}).forEach((name) => {
    registerClient(name, options.clients[name])
  })

  const id: Id = options.id || (`service.${options.servicePath}` as Id)

  const state = makeState<M, S>({
    clientAlias,
    servicePath,
    idField,
    tempIdField,
    whitelist: options.whitelist,
    paramsForServer: options.paramsForServer,
    skipRequestIfExists: options.skipRequestIfExists,
    state: options.state,
  })

  const getters = makeGetters<M, S, G>({
    clients,
    Model,
    ssr: options.ssr,
    getters: options.getters,
  })

  const actions = makeActions<M, S, G, A>({
    clients,
    getters,
    actions: options.actions,
    Model,
    ssr: options.ssr,
  })

  function useStore(pinia?: Pinia) {
    const useStoreDefinition = definePiniaStore<Id, ServiceStoreDefaultState & S, G, A>({
      id,
      state,
      getters,
      actions,
    }) as unknown as ServiceStoreDefinition<Id, M, S, G, A>
    const initializedStore = useStoreDefinition(pinia) as ServiceStore<Id, M, ServiceStoreDefaultState & S, G, A>

    initializedStore.isSsr

    if (!isInitialized) {
      isInitialized = true
      // Monkey patch the model with the store and other options
      Object.assign(options.Model, {
        store: initializedStore,
        pinia,
        servicePath: options.servicePath,
        idField,
        tempIdField,
        clients,
        // Bind `this` in custom actions to the store.
        ...Object.keys(options.actions as Record<string, any>).reduce((boundActions: any, key: string) => {
          const fn = (options.actions as Record<string, any>)[key]
          boundActions[key] = fn.bind(initializedStore)
          return boundActions
        }, {}),
      })

      const client = clients[clientAlias]
      if (!client) {
        throw new Error(
          `There is no registered FeathersClient named '${clientAlias}'. You need to provide one in the 'defineStore' options.`,
        )
      }
      const service = client.service(servicePath)

      const opts = { idField, debounceEventsTime, debounceEventsGuarantee, handleEvents }

      registerModel(options.Model, initializedStore)
      enableServiceEvents({
        service,
        Model,
        store: initializedStore,
        options: opts,
      })
    }
    return initializedStore
  }

  return useStore
}

function makeOptions<
  Id extends string,
  M extends BaseModel = BaseModel,
  S extends StateTree = {},
  G extends _GettersTree<S> = {},
  A = {},
>(_options: DefineFeathersStoreOptions<Id, M, S, G, A>): Required<DefineFeathersStoreOptions<Id, M, S, G, A>> {
  const defaultSharedState: ServiceStoreSharedStateDefineOptions = {
    clientAlias: 'api',
    servicePath: '',
    idField: 'id',
    tempIdField: '__tempId',
    paramsForServer: [],
    whitelist: [],
    skipRequestIfExists: false,
  }

  const defaults = Object.assign(defaultSharedState, {
    id: `service.${_options.servicePath}`,
    ssr: false,
    clients: {},
    enableEvents: true,
    handleEvents: {},
    debounceEventsTime: 20,
    debounceEventsGuarantee: false,
    state: () => ({}),
    getters: {},
    actions: {},
  })

  let Model

  // If no Model class is provided, create a dynamic one.
  if (!_options.Model) {
    Model = class DynamicBaseModel extends BaseModel {
      static dynamicBaseModel = true
      static modelName = _options.servicePath
    }
  } else {
    Model = _options.Model
  }

  if (!Model.modelName) {
    Model.modelName = Model.name
  }

  const options = Object.assign(defaults, { Model }, _options)

  options.handleEvents.created ||= () => options.enableEvents
  options.handleEvents.patched ||= () => options.enableEvents
  options.handleEvents.updated ||= () => options.enableEvents
  options.handleEvents.removed ||= () => options.enableEvents

  return options
}
