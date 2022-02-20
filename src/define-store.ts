import { makeServiceStore, BaseModel } from './service-store/index'
import { defineStore as definePiniaStore, Pinia, StateTree, _GettersTree } from 'pinia'
import { registerModel } from './models'
import { registerClient, clients } from './clients'
import { enableServiceEvents } from './service-store/events'

import { DefineFeathersStoreOptions, ServiceStoreDefinition } from './types'
import { ServiceStoreSharedStateDefineOptions } from './service-store/types'

export const defaultSharedState: ServiceStoreSharedStateDefineOptions = {
  clientAlias: 'api',
  servicePath: '',
  idField: 'id',
  paramsForServer: [],
  whitelist: [],
  skipRequestIfExists: false
}

export function defineStore<
  Id extends string,
  M extends BaseModel = BaseModel,
  S extends StateTree = StateTree, 
  G extends _GettersTree<S> = {}, 
  A = {}>(
  _options: DefineFeathersStoreOptions<Id, M, S, G, A>
): (pinia?: Pinia) => ServiceStoreDefinition<Id, M, S, G, A> {
  const options = makeOptions<Id, M, S, G, A>(_options);

  const {
    servicePath,
    idField,
    handleEvents,
    debounceEventsTime,
    debounceEventsMaxWait,
    clientAlias,
    Model,
  } = options
  let isInitialized = false

  Object.keys(options.clients || {}).forEach((name) => {
    registerClient(name, clients[name])
  })

  // Create and initialize the Pinia store.
  const storeOptions = makeServiceStore<Id, M, S, G, A>({
    ssr: options.ssr,
    id: options.id,
    idField: options.idField,
    clientAlias: options.clientAlias,
    servicePath: options.servicePath,
    clients: options.clients,
    Model: options.Model,
    state: options.state,
    getters: options.getters,
    actions: options.actions,
    whitelist: options.whitelist,
    paramsForServer: options.paramsForServer,
    skipRequestIfExists: options.skipRequestIfExists
  })

  function useStore(pinia?: Pinia) {
    const useStoreDefinition = definePiniaStore<Id, S, G, A>(storeOptions)
    const initializedStore = useStoreDefinition(pinia)

    initializedStore.isSsr

    if (!isInitialized) {
      isInitialized = true
      // Monkey patch the model with the store and other options
      Object.assign(options.Model, {
        store: initializedStore,
        pinia,
        servicePath: options.servicePath,
        idField: options.idField,
        clients
      })

      const client = clients[clientAlias]
      if (!client) {
        throw new Error(
          `There is no registered FeathersClient named '${clientAlias}'. You need to provide one in the 'defineStore' options.`,
        )
      }
      const service = client.service(servicePath)

      const opts = { idField, debounceEventsTime, debounceEventsMaxWait, handleEvents }
      registerModel(options.Model, initializedStore)
      enableServiceEvents<M>({
        service,
        // @ts-ignore
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
  S extends StateTree = StateTree, 
  G extends _GettersTree<S> = {}, 
  A = {}>(
  _options: DefineFeathersStoreOptions<Id, M, S, G, A>
): Required<DefineFeathersStoreOptions<Id, M, S, G, A>> {
  const defaults = Object.assign(
    {},
    defaultSharedState,
    {
      id: `service.${_options.servicePath}`,
      ssr: false,
      clients: {},
      enableEvents: true,
      handleEvents: {},
      debounceEventsTime: 20,
      debounceEventsMaxWait: 1000,
      state: () => ({}),
      getters: {},
      actions: {},
    }
  )

  _options.clientAlias

  let Model: M

  // If no Model class is provided, create a dynamic one.
  if (!_options.Model) {
    Model = class DynamicBaseModel extends BaseModel {
      static modelName = _options.servicePath
    }
  } else {
    Model = _options.Model
  }

  if (!Model.modelName) {
    Model.modelName = Model.name
  }


  const options = Object.assign(defaults, { Model }, _options);

  options.handleEvents.created ||= () => options.enableEvents
  options.handleEvents.patched ||= () => options.enableEvents
  options.handleEvents.updated ||= () => options.enableEvents
  options.handleEvents.removed ||= () => options.enableEvents

  return options;
}