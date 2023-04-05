import type { Application, FeathersService } from '@feathersjs/feathers'
import type { HandleEvents } from './use-data-store'
import type { AnyData } from './types'
import { feathers } from '@feathersjs/feathers'
import { defineStore } from 'pinia'
import { PiniaService } from './create-pinia-service'
import { useDataStore } from './use-data-store'
import { feathersPiniaHooks } from './hooks'
import { useServiceEvents } from './use-data-store'

interface ServiceOptions {
  idField?: string
  whitelist?: string[]
  paramsForServer?: string[]
  skipGetIfExists?: boolean
  handleEvents?: HandleEvents<AnyData>
  debounceEventsTime?: number
  debounceEventsGuarantee?: boolean
  setupInstance?: (data: any) => any
  customSiftOperators?: Record<string, any>
}

interface CreateVueClientOptions extends ServiceOptions {
  idField: string
  pinia: any
  ssr?: boolean
  services?: Record<string, ServiceOptions>
}

type CreatePiniaServiceTypes<T extends { [key: string]: FeathersService }> = {
  [Key in keyof T]: PiniaService<T[Key]>
}

export function createPiniaClient<Client extends Application>(
  client: Client,
  options: CreateVueClientOptions,
): Application<CreatePiniaServiceTypes<Client['services']>> {
  const vueApp = feathers()
  vueApp.defaultService = function (location: string) {
    const serviceOptions = options.services?.[location] || {}

    // combine service and global options
    const idField = serviceOptions?.idField || options.idField
    const whitelist = (serviceOptions.whitelist || []).concat(options.whitelist || [])
    const paramsForServer = (serviceOptions.paramsForServer || []).concat(options.paramsForServer || [])
    const handleEvents = serviceOptions?.handleEvents || options.handleEvents
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

    // create pinia store
    const storeName = `service:${location}`
    const useStore = defineStore(storeName, () => {
      const utils = useDataStore({
        idField,
        whitelist,
        paramsForServer,
        customSiftOperators,
        ssr: options.ssr,
      })
      return utils
    })

    const clientService = client.service(location)
    const vueService = new PiniaService(clientService, {
      store: useStore(options.pinia),
      setupFn: serviceOptions?.setupInstance,
      servicePath: location,
    })

    useServiceEvents({
      service: vueService,
      debounceEventsTime,
      debounceEventsGuarantee,
      handleEvents,
    })

    return vueService
  }

  // register hooks on every service
  vueApp.mixins.push((service: any) => {
    service.hooks({
      around: feathersPiniaHooks(),
    })
  })

  Object.defineProperties(vueApp, {
    authentication: {
      get() {
        return (client as any).authentication
      },
    },
    authenticate: {
      get() {
        return (client as any).authenticate
      },
    },
    reAuthenticate: {
      get() {
        return (client as any).reAuthenticate
      },
    },
    logout: {
      get() {
        return (client as any).logout
      },
    },
  })

  return vueApp
}
