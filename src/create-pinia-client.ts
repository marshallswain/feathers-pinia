import type { Application, FeathersService } from '@feathersjs/feathers'
import { feathers } from '@feathersjs/feathers'
import { defineStore } from 'pinia'
import type { HandleEvents } from './stores/index.js'
import type { AnyData, CustomFilter } from './types.js'
import { PiniaService } from './create-pinia-service.js'
import type { Service } from './modeling/use-feathers-instance.js'
import { useServiceEvents, useServiceStore } from './stores/index.js'
import { feathersPiniaHooks } from './hooks/index.js'
import { storeAssociated, useServiceInstance } from './modeling/index.js'
import { defineGetters, defineVirtualProperties, defineVirtualProperty, pushToStore } from './utils/index.js'
import { syncWithStorage as __sync, clearStorage } from './localstorage/index.js'

export interface SetupInstanceUtils {
  app?: any
  service?: any
  servicePath?: string
}

export interface PiniaServiceConfig {
  /**
   * The name of the store to use for this service. Defaults to `service:${servicePath}`.
   * You can also use storeName to make two services share the same store.
   */
  storeName?: string
  /**
   * Overrides the service used for instance-level service methods, like patch, and remove.
   * Useful for "proxy" services. For example: `pages/full` loads the page record with populated
   * data, but you want to patch/remove the record through the `pages` service.
   */
  instanceServicePath?: string
  idField?: string
  defaultLimit?: number
  syncWithStorage?: boolean | string[]
  whitelist?: string[]
  paramsForServer?: string[]
  skipGetIfExists?: boolean
  handleEvents?: HandleEvents<AnyData>
  debounceEventsTime?: number
  debounceEventsGuarantee?: boolean
  setupInstance?: (data: any, utils: SetupInstanceUtils) => any
  customizeStore?: (data: ReturnType<typeof useServiceStore>) => Record<string, any>
  customSiftOperators?: Record<string, any>
  /**
   * Custom filters are applied before the sift operators. They are useful for custom
   * filters that are not supported by sift, like `$fuzzy`.
   */
  customFilters?: CustomFilter[]
}

export interface CreatePiniaClientConfig extends PiniaServiceConfig {
  idField: string
  pinia: any
  ssr?: boolean
  storage?: Storage
  services?: Record<string, PiniaServiceConfig>
}

export type AppWithServices = {
  services: { [key: string]: FeathersService }
}

export type CreatePiniaServiceTypes<T extends AppWithServices> = {
  [Key in keyof T['services']]: PiniaService<T['services'][Key]> & T['services'][Key]
}

export interface AppExtensions {
  storeAssociated: (data: any, config: Record<string, string>) => void
  clearStorage: () => void
  pushToStore: <Data>(data: Data, servicePath: string) => void
  defineVirtualProperty: <Data>(data: Data, key: string, getter: any) => void
  defineVirtualProperties: <Data>(data: Data, getters: Record<string, any>) => void
}

/**
 * ```ts
 * import { FeathersPiniaClient } from 'feathers-pinia'
 * import { Application, Service } from '@feathersjs/feathers'
 * interface Book {
 *   id: string
 *   title: string
 * }
 * interface ServiceTypes {
 *   books: Service<Book>
 * }
 * export type MyFeathersPiniaApp = FeathersPiniaClient<Application<ServiceTypes>>
 * ```
 */
export type FeathersPiniaClient<App extends Application> = Application<CreatePiniaServiceTypes<App>> & AppExtensions

export function createPiniaClient<App extends Application>(
  client: App,
  options: CreatePiniaClientConfig,
): Application<CreatePiniaServiceTypes<App>> & AppExtensions {
  const vueApp = feathers()

    ;(vueApp as any).defaultService = function (location: string) {
    const serviceOptions = options.services?.[location] || {}

    // combine service and global options
    const idField = serviceOptions.idField || options.idField
    const defaultLimit = serviceOptions.defaultLimit || options.defaultLimit || 10
    const whitelist = (serviceOptions.whitelist || []).concat(options.whitelist || [])
    const paramsForServer = (serviceOptions.paramsForServer || []).concat(options.paramsForServer || [])
    const handleEvents = serviceOptions.handleEvents || options.handleEvents
    const debounceEventsTime
      = serviceOptions.debounceEventsTime != null ? serviceOptions.debounceEventsTime : options.debounceEventsTime
    const debounceEventsGuarantee
      = serviceOptions.debounceEventsGuarantee != null
        ? serviceOptions.debounceEventsGuarantee
        : options.debounceEventsGuarantee
    const customSiftOperators = Object.assign({}, serviceOptions.customSiftOperators || {}, options.customSiftOperators || {})
    const customFilters = [...(serviceOptions.customFilters || []), ...(options.customFilters || [])]
    function customizeStore(utils: any) {
      const fromGlobal = Object.assign(utils, options.customizeStore ? options.customizeStore(utils) : utils)
      const fromService = Object.assign(
        fromGlobal,
        serviceOptions.customizeStore ? serviceOptions.customizeStore(fromGlobal) : fromGlobal,
      )
      return fromService
    }

    function wrappedSetupInstance(data: any) {
      // if serviceOptions.instanceServicePath is set, it's an instance-level override, so use that instead of location
      const servicePath = serviceOptions.instanceServicePath || location
      const service = vueApp.service(servicePath) as Service

      const asFeathersModel = useServiceInstance(data, {
        service,
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        store,
      })

      // call the provided `setupInstance`
      const utils = { app: vueApp, service, servicePath }
      const fromGlobal = options.setupInstance ? options.setupInstance(asFeathersModel, utils) : asFeathersModel
      const serviceLevel = serviceOptions.setupInstance ? serviceOptions.setupInstance(fromGlobal, utils) : fromGlobal
      return serviceLevel
    }

    // create pinia store, or reuse existing one by storeName
    const storeName = serviceOptions.storeName || `service:${location}`
    const existingStore = options.pinia._s.get(storeName)
    let store: any
    if (existingStore) {
      store = existingStore
    }
    else {
      const useStore = defineStore(storeName, () => {
        const utils = useServiceStore({
          idField,
          servicePath: location,
          defaultLimit,
          whitelist,
          paramsForServer,
          customSiftOperators,
          customFilters,
          ssr: options.ssr,
          setupInstance: wrappedSetupInstance,
        })
        const custom = customizeStore(utils)
        return { ...utils, ...custom }
      })
      store = useStore(options.pinia)
    }

    // storage-sync
    if (!options.ssr && options.storage) {
      const defaultStorageKeys = ['itemsById', 'pagination']
      const globalStorageKeys
        = options.syncWithStorage === true
          ? defaultStorageKeys
          : Array.isArray(options.syncWithStorage)
            ? options.syncWithStorage
            : []
      const serviceStorageKeys
        = serviceOptions.syncWithStorage === true
          ? defaultStorageKeys
          : Array.isArray(serviceOptions.syncWithStorage)
            ? serviceOptions.syncWithStorage
            : []
      const syncWithStorage = [...new Set([...globalStorageKeys, ...serviceStorageKeys])]
      const shouldSyncStorage = syncWithStorage.length > 0
      if (shouldSyncStorage)
        __sync(store, syncWithStorage, options.storage)
    }

    const clientService = client.service(location)
    const piniaService = new PiniaService(clientService, { store, servicePath: location })

    useServiceEvents({
      service: piniaService,
      debounceEventsTime,
      debounceEventsGuarantee,
      handleEvents,
    })

    return piniaService
  }

  // register hooks on every service
  const mixin: any = (service: any) => {
    service.hooks({
      around: feathersPiniaHooks(),
    })
  }
  vueApp.mixins.push(mixin)

  defineGetters(vueApp, {
    authentication() {
      return (client as any).authentication
    },
    authenticate() {
      return (client as any).authenticate
    },
    reAuthenticate() {
      return (client as any).reAuthenticate
    },
    logout() {
      return (client as any).logout
    },
    clearStorage() {
      if (!options.ssr && options.storage)
        return clearStorage(options.storage)
    },
  })

  Object.assign(vueApp, {
    // TODO: remove in v5
    storeAssociated,
    pushToStore<Data>(data: Data, servicePath: string) {
      const service = vueApp.service(servicePath) as unknown as { createInStore: any }
      return pushToStore(data, service)
    },
    defineVirtualProperty,
    defineVirtualProperties,
  })

  return vueApp as FeathersPiniaClient<App>
}
