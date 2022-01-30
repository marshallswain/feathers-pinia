import { ServiceState } from './types'

interface MakeStateOptions {
  servicePath: string
  clientAlias?: string
  idField?: string
  tempIdField?: string
  state?: { [key: string]: any }
  whitelist?: string[]
}

export function makeState(options: MakeStateOptions) {
  return (): ServiceState => ({
    clientAlias: options?.clientAlias || 'api',
    servicePath: options?.servicePath || '',
    idField: options?.idField || 'id',
    tempIdField: options?.tempIdField || '__tempId',
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
    ...(typeof options.state === 'function' ? options.state() : options?.state),
  })
}
