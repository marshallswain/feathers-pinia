import { BaseModel } from './service-store/base-model'
import { registerClient } from './clients'
import { defineStore } from './define-store'
import { Ref } from 'vue-demi'

import { DefineFeathersStoreOptions, HandleEvents } from './types'
import { Pinia, StateTree, _GettersTree } from 'pinia'
import { ServiceStore } from './service-store/types'

interface SetupOptions {
  ssr?: boolean | Ref<boolean>
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

  function defineStoreWrapper<
    Id extends string,
    M extends BaseModel = BaseModel,
    S extends StateTree = StateTree, 
    G extends _GettersTree<S> = {}, 
    A = {}
  >(...args: [DefineFeathersStoreOptions<Id, M, S, G, A>] | 
    [Id, Omit<DefineFeathersStoreOptions<Id, M, S, G, A>, 'id'>]
  ): (pinia?: Pinia) => ServiceStore<Id, M, S, G, A> {
    const id = args.length === 2 ? args[0] : args[0].id
    const options= args.length === 2 ? args[1] : args[0]
    // @ts-expect-error todo
    options.id = id || `service.${options.servicePath}`

    return defineStore<Id, M, S, G, A>(Object.assign({}, globalOptions, options))
  }

  return {
    defineStore: defineStoreWrapper,
    BaseModel,
  }
}
