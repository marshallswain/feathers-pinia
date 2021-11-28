import { BaseModel } from './service-store/index'
import { registerClient } from './clients'
import { defineStore, DefineStoreOptions } from './define-store'

import { HandleEvents } from './types'

interface SetupOptions {
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

  function defineStoreWrapper(options: DefineStoreOptions) {
    return defineStore(Object.assign({}, globalOptions, options))
  }

  return {
    defineStore: defineStoreWrapper,
    BaseModel,
  }
}
