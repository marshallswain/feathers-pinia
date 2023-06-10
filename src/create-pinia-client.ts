import type { Application, FeathersService } from '@feathersjs/feathers'
import type { HandleEvents } from './stores/index.js'
import type { AnyData } from './types.js'
import { feathers } from '@feathersjs/feathers'
import { defineStore } from 'pinia'
import { PiniaService } from './create-pinia-service.js'
import { useServiceStore, useServiceEvents } from './stores/index.js'
import { feathersPiniaHooks } from './hooks/index.js'
import { storeAssociated, useServiceInstance } from './modeling/index.js'
import { defineGetters } from './utils/index.js'
import { clearStorage, syncWithStorage as __sync } from './localstorage/index.js'

interface SetupInstanceUtils {
  app?: any
  service?: any
  servicePath?: string
}

interface PiniaServiceConfig {
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
}

interface CreatePiniaClientConfig extends PiniaServiceConfig {
  idField: string
  pinia: any
  ssr?: boolean
  storage?: Storage
  services?: Record<string, PiniaServiceConfig>
}

type CreatePiniaServiceTypes<T extends { [key: string]: FeathersService }> = {
  [Key in keyof T]: PiniaService<T[Key]> & T[Key]
}

interface AppExtensions {
  storeAssociated: (data: any, config: Record<string, string>) => void
  clearStorage: () => void
}

export function createPiniaClient<Client extends Application>(
  client: Client,
  options: CreatePiniaClientConfig,
): Application<CreatePiniaServiceTypes<Client['services']>> & AppExtensions {
  const vueApp = feathers()

  vueApp.defaultService = function (location: string) {
    const serviceOptions = options.services?.[location] || {}

    // combine service and global options
    const idField = serviceOptions.idField || options.idField
    const defaultLimit = serviceOptions.defaultLimit || options.defaultLimit || 10
    const whitelist = (serviceOptions.whitelist || []).concat(options.whitelist || [])
    const paramsForServer = (serviceOptions.paramsForServer || []).concat(options.paramsForServer || [])
    const handleEvents = serviceOptions.handleEvents || options.handleEvents
    const debounceEventsTime =
      serviceOptions.debounceEventsTime != null ? serviceOptions.debounceEventsTime : options.debounceEventsTime
    const debounceEventsGuarantee =
      serviceOptions.debounceEventsGuarantee != null
        ? serviceOptions.debounceEventsGuarantee
        : options.debounceEventsGuarantee
    const customSiftOperators = Object.assign(
      {},
      serviceOptions.customSiftOperators || {},
      options.customSiftOperators || {},
    )
    function customizeStore(utils: any) {
      const fromGlobal = Object.assign(utils, options.customizeStore ? options.customizeStore(utils) : utils)
      const fromService = Object.assign(
        fromGlobal,
        serviceOptions.customizeStore ? serviceOptions.customizeStore(fromGlobal) : fromGlobal,
      )
      return fromService
    }

    function wrappedSetupInstance(data: any) {
      const asFeathersModel = useServiceInstance(data, {
        service: vueApp.service(location),
        store,
      })

      // call the provided `setupInstance`
      const utils = {
        app: vueApp,
        service: vueApp.service(location),
        servicePath: location,
      }
      const fromGlobal = options.setupInstance ? options.setupInstance(asFeathersModel, utils) : asFeathersModel
      const serviceLevel = serviceOptions.setupInstance ? serviceOptions.setupInstance(data, utils) : fromGlobal
      return serviceLevel
    }

    // create pinia store
    const storeName = `service:${location}`
    const useStore = defineStore(storeName, () => {
      const utils = useServiceStore({
        idField,
        defaultLimit,
        whitelist,
        paramsForServer,
        customSiftOperators,
        ssr: options.ssr,
        setupInstance: wrappedSetupInstance,
      })
      const custom = customizeStore(utils)
      return { ...utils, ...custom }
    })
    const store = useStore(options.pinia)

    // storage-sync
    if (!options.ssr && options.storage) {
      const defaultStorageKeys = ['itemsById', 'pagination']
      const globalStorageKeys =
        options.syncWithStorage === true
          ? defaultStorageKeys
          : Array.isArray(options.syncWithStorage)
          ? options.syncWithStorage
          : []
      const serviceStorageKeys =
        serviceOptions.syncWithStorage === true
          ? defaultStorageKeys
          : Array.isArray(serviceOptions.syncWithStorage)
          ? serviceOptions.syncWithStorage
          : []
      const syncWithStorage = [...new Set([...globalStorageKeys, ...serviceStorageKeys])]
      const shouldSyncStorage = syncWithStorage.length > 0
      if (shouldSyncStorage) {
        __sync(store, syncWithStorage, options.storage)
      }
    }

    const clientService = client.service(location)
    const piniaService = new PiniaService(clientService, {
      store,
      servicePath: location,
    })

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
      if (!options.ssr && options.storage) {
        return clearStorage(options.storage)
      }
    },
  })

  Object.assign(vueApp, { storeAssociated })

  return vueApp as Application<CreatePiniaServiceTypes<Client['services']>> & AppExtensions
}
