export * from './convert-data'
export * from './deep-unref'
export * from './define-properties'
export * from './service-utils'
export * from './use-counter'
export * from './use-instance-defaults'
export * from './utils'

// typical Feathers service methods not on PiniaService
export const existingServiceMethods = [
  'update',
  'hooks',
  'setMaxListeners',
  'getMaxListeners',
  'addListener',
  'prependListener',
  'once',
  'prependOnceListener',
  'removeListener',
  'off',
  'removeAllListeners',
  'listeners',
  'rawListeners',
  'emit',
  'eventNames',
  'listenerCount',
  'on',
]
