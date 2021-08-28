import { makeServiceStore, BaseModel } from './service-store/index'
import { defineStore as definePiniaStore, Pinia, Store } from 'pinia'
import { registerModel } from './models'
import { registerClient } from './clients'
import { enableServiceEvents } from './service-store/events'

import { Application as FeathersClient } from '@feathersjs/feathers'
import { HandleEvents } from './types'

export interface DefineStoreOptions {
  servicePath: string
  Model?: any
  idField?: '_id' | string
  id?: string
  clientAlias?: 'api' | string
  clients?: { [alias: string]: FeathersClient }
  enableEvents?: boolean
  handleEvents?: HandleEvents
  debounceEventsTime?: number
  debounceEventsMaxWait?: number
  whitelist?: string[]
  state?: { [k: string]: any }
  getters?: { [k: string]: Function }
  actions?: { [k: string]: Function }
}

export function defineStore(options: DefineStoreOptions) {
  const {
    clients = {},
    servicePath,
    idField = '_id',
    enableEvents = true,
    debounceEventsTime = 20,
    debounceEventsMaxWait = 1000,
    whitelist = [],
    state = {},
    getters = {},
    actions = {},
  } = options
  let { handleEvents = {} } = options
  let isInitialized = false

  Object.keys(clients).forEach((name) => {
    registerClient(name, clients[name])
  })

  // Setup the event handlers. By default they just return the value of `options.enableEvents`
  const defaultHandleEvents = {
    created: () => enableEvents,
    patched: () => enableEvents,
    updated: () => enableEvents,
    removed: () => enableEvents,
  }

  handleEvents = Object.assign({}, defaultHandleEvents, handleEvents)

  // If no Model class is provided, create a dynamic one.
  if (!options.Model) {
    const classes: any = {}
    class DynamicBaseModel extends BaseModel {
      static modelName = servicePath
    }
    options.Model = DynamicBaseModel
  }
  if (!options.Model.modelName) {
    options.Model.modelName = options.Model.name
  }

  // Create and initialize the Pinia store.
  const storeOptions: any = makeServiceStore({
    storeId: options.id || `service.${options.servicePath}`,
    idField: options.idField || idField || 'id',
    clientAlias: options.clientAlias || 'api',
    servicePath,
    clients,
    Model: options.Model,
    state,
    getters,
    actions,
    whitelist,
  })
  function useStore(pinia?: Pinia): any {
    const useStoreDefinition = definePiniaStore(storeOptions)
    const initializedStore: Store = useStoreDefinition(pinia)

    if (!isInitialized) {
      isInitialized = true
      // Monkey patch the model with the store and other options
      Object.assign(options.Model, {
        store: initializedStore,
        pinia,
        servicePath: options.servicePath,
        idField: options.idField || idField,
        clients,
        // Bind `this` in custom actions to the store.
        ...Object.keys(actions || {}).reduce((actions: any, key: string) => {
          actions[key] = (actions as any)[key].bind(initializedStore)
          return actions
        }, {}),
      })

      const service = clients[options.clientAlias || 'api'].service(servicePath)

      const opts = { idField, debounceEventsTime, debounceEventsMaxWait, handleEvents }
      registerModel(options.Model, initializedStore as any)
      enableServiceEvents({
        service,
        Model: options.Model,
        store: initializedStore,
        options: opts,
      })
    }
    return initializedStore
  }

  return useStore
}
