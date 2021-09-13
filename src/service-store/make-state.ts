import { ServiceState } from './types'

interface MakeStateOptions {
  servicePath: string
  clientAlias?: string
  idField?: string
  state?: { [key: string]: any }
  whitelist?: string[]
}

export function makeState(options: MakeStateOptions) {
  return (): ServiceState => ({
    clientAlias: options?.clientAlias || 'api',
    servicePath: options?.servicePath || '',
    idField: options?.idField || 'id',
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
    whitelist: options?.whitelist || [],
    ...options?.state,
  })
}
