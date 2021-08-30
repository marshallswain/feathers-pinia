import { ServiceState, ServiceOptions } from './types'

export function makeState(options: ServiceOptions) {
  return (): ServiceState => ({
    clientAlias: options.clientAlias || 'api',
    servicePath: options.servicePath,
    idField: options.idField || 'id',
    ids: [],
    itemsById: {},
    tempsById: {},
    clonesById: {},
    pendingById: {
      Model: {
        find: false,
        count: false,
        get: false,
      },
    },
    eventLocksById: {
      created: {},
      patched: {},
      updated: {},
      removed: {},
    },
    pagination: {},
    whitelist: options.whitelist,
    ...options.state,
  })
}
