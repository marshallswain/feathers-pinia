import { BaseModel } from './service-store/index'
import { registerClient } from './clients'
import { defineStore, DefineStoreOptions } from './define-store'

import { HandleEvents } from './types'

interface SetupOptions {
  ssr?: boolean
  clients: { [alias: string]: any }
  idField?: string
  handleEvents?: HandleEvents
  enableEvents?: boolean
  debounceEventsTime?: number
  debounceEventsMaxWait?: number
  whitelist?: string[]
  state?: () => { [k: string]: any }
  getters?: { [k: string]: (state: any) => any }
  actions?: { [k: string]: Function }
}

export function setupFeathersPinia(globalOptions: SetupOptions) {
  const { clients } = globalOptions
  Object.keys(clients).forEach((name) => {
    registerClient(name, clients[name])
  })

  function defineStoreWrapper(...args: [DefineStoreOptions] | [string, DefineStoreOptions]) {
    const id = args.length === 2 ? args[0] : args[0].id
    const options = args.length === 2 ? args[1] : args[0]
    options.id = id || `service.${options.servicePath}`
    return defineStore(Object.assign({}, globalOptions, options))
  }

  return {
    defineStore: defineStoreWrapper,
    BaseModel,
  }
}
