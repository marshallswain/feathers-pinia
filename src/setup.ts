import { BaseModel } from './service-store/index'
import { registerClient } from './clients'
import { defineStore } from './define-store'
import { Ref } from 'vue-demi'

import { DefineFeathersStoreOptions, HandleEvents, ServiceStoreDefinition } from './types'
import { StateTree, _GettersTree } from 'pinia'

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

type DefineStoreWrapperArgs<
  Id extends string,
  M extends BaseModel = BaseModel,
  S extends StateTree = StateTree, 
  G extends _GettersTree<S> = {}, 
  A = {}
> = 
[DefineFeathersStoreOptions<Id, M, S, G, A>] | 
[Id, DefineFeathersStoreOptions<Id, M, S, G, A>]

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
  >(options: DefineFeathersStoreOptions<Id, M, S, G, A>): ServiceStoreDefinition<Id, M, S, G, A>
  function defineStoreWrapper<
    Id extends string,
    M extends BaseModel = BaseModel,
    S extends StateTree = StateTree, 
    G extends _GettersTree<S> = {}, 
    A = {}
  >(
    id: Id, 
    options: DefineFeathersStoreOptions<Id, M, S, G, A>
  ): ServiceStoreDefinition<Id, M, S, G, A>
  function defineStoreWrapper<
    Id extends string,
    M extends BaseModel = BaseModel,
    S extends StateTree = StateTree, 
    G extends _GettersTree<S> = {}, 
    A = {}
  >(...args: DefineStoreWrapperArgs<Id, M, S, G, A>): ServiceStoreDefinition<Id, M, S, G, A> {
    const id = args.length === 2 ? args[0] : args[0].id
    const options = args.length === 2 ? args[1] : args[0]
    options.id = id || `service.${options.servicePath}`
    // @ts-ignore
    return defineStore<Id, M, S, G, A>(Object.assign({}, globalOptions, options))
  }

  return {
    defineStore: defineStoreWrapper,
    BaseModel,
  }
}
