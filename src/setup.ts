import { makeServiceStore, BaseModel } from './service-store/index'
import { defineStore as piniaDefineStore } from 'pinia'
import { registerModel } from './models'
import { clients, registerClient } from './clients'
import { enableServiceEvents } from './service-store/events'
import { HandleEvents } from './types'

interface SetupOptions {
  pinia: any
  clients: { [alias: string]: any }
  idField?: string
  handleEvents?: HandleEvents
  enableEvents?: boolean
  debounceEventsTime?: number
  debounceEventsMaxWait?: number
  whitelist?: string[]
}
interface DefineStoreOptions {
  id?: string
  clientAlias?: string
  servicePath: string
  idField?: string
  Model?: any
  actions?: { [k: string]: Function }
}

export function setup({
  pinia,
  clients,
  idField,
  handleEvents = {},
  enableEvents = true,
  debounceEventsTime = 20,
  debounceEventsMaxWait = 1000,
  whitelist = []
}: SetupOptions) {
  Object.keys(clients).forEach((name) => {
    registerClient(name, clients[name])
  })

  function defineStore(options: DefineStoreOptions) {
    const { servicePath } = options

    // Setup the event handlers. By default they just return the value of `options.enableEvents`
    const defaultHandleEvents = {
      created: () => enableEvents,
      patched: () => enableEvents,
      updated: () => enableEvents,
      removed: () => enableEvents
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
      actions: options.actions,
      whitelist
    })
    const useStore: any = piniaDefineStore(storeOptions)
    const initializedStore = useStore(pinia)

    // Monkey patch the model with the store and other options
    Object.assign(options.Model, {
      store: initializedStore,
      pinia,
      servicePath: options.servicePath,
      idField: options.idField || idField,
      clients,
      // Bind `this` in custom actions to the store.
      ...Object.keys(options.actions || {}).reduce((actions: any, key: string) => {
        actions[key] = (options.actions as any)[key].bind(initializedStore)
        return actions
      }, {})
    })

    const service = clients[options.clientAlias || 'api'].service(servicePath)

    const opts = { idField, debounceEventsTime, debounceEventsMaxWait, handleEvents }
    registerModel(options.Model, initializedStore as any)
    enableServiceEvents({ service, Model: options.Model, store: initializedStore, options: opts })

    return useStore
  }

  return {
    defineStore,
    BaseModel
  }
}

// export function setupFeathersPinia(pinia: any, { clients }: { clients: any }) {
//   const piniaPlugin = (context: any) => {
//     Object.keys(pinia.state.value).forEach((name) => {
//       const store = pinia.state.value[name]
//       if (store.$clients === null) {
//         store.$clients = clients
//         console.log(name, store)
//       }
//     })
//     return {}
//   }
//   pinia.use(piniaPlugin)
// }
