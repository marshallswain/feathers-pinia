import type { Application, FeathersService } from '@feathersjs/feathers'
import type { HandleEvents } from './use-data-store'
import type { AnyData } from './types'
import { feathers } from '@feathersjs/feathers'
import { defineStore } from 'pinia'
import { VueService } from './create-vue-service'
import { useDataStore } from './use-data-store'
import { feathersPiniaHooks } from './hooks'

interface ServiceOptions {
  idField?: string
  whitelist?: string[]
  paramsForServer?: string[]
  skipRequestIfExists?: boolean
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

type CreateVueServiceTypes<T extends { [key: string]: FeathersService }> = {
  [Key in keyof T]: VueService<T[Key]>
}

export function createVueClient<Client extends Application>(
  client: Client,
  options: CreateVueClientOptions,
): Application<CreateVueServiceTypes<Client['services']>> {
  const vueApp = feathers()
  vueApp.defaultService = function (location: string) {
    const { whitelist = [], paramsForServer = [] } = options
    const serviceOptions = options.services?.[location]

    // create pinia store
    const storeName = `service:${location}`
    const useStore = defineStore(storeName, () => {
      const utils = useDataStore({
        idField: serviceOptions?.idField || options.idField,
        whitelist: (serviceOptions?.whitelist || []).concat(whitelist),
        paramsForServer: (serviceOptions?.paramsForServer || []).concat(paramsForServer),
        handleEvents: serviceOptions?.handleEvents || options.handleEvents,
        debounceEventsTime: serviceOptions?.debounceEventsTime || options.debounceEventsTime,
        debounceEventsGuarantee: serviceOptions?.debounceEventsGuarantee || options.debounceEventsGuarantee,
        customSiftOperators: options.customSiftOperators,
        ssr: options.ssr,
      })
      return utils
    })

    const vueService = new VueService(client.service(location), {
      store: useStore(options.pinia),
      setupFn: serviceOptions?.setupInstance,
      servicePath: location,
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
