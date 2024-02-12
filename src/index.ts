export * from './types.js'

export { createPiniaClient } from './create-pinia-client.js'
export type * from './create-pinia-client.js'
export { PiniaService } from './create-pinia-service'
export { OFetch } from './feathers-ofetch.js'

export { feathersPiniaAutoImport } from './unplugin-auto-import-preset.js'

export * from './hooks/index.js'
export * from './localstorage/index.js'
export * from './modeling/index.js'
export * from './use-auth/index.js'
export * from './use-find-get/index.js'
export * from './stores/index.js'
export * from './composables/index.js'
export * from './utils/utils.js'
export * from './utils/service-utils.js'
export { useInstanceDefaults, defineGetters, defineSetters, defineValues } from './utils/index.js'
