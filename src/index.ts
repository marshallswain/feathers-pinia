export { setupFeathersPinia } from './setup'
export { defineStore, BaseModel } from './service-store'
export { defineAuthStore } from './define-auth-store'

// Composition Stores
export { useAuth } from './use-auth'
export {
  useService,
  useServiceClones,
  useServiceStorage,
  useLocal,
  useServiceApiFeathers,
  useServiceEvents,
  useServiceLocal,
  useServicePagination,
  useServicePending,
  useServiceTemps,
} from './use-service/'

// Composition Models
export {
  useModelStore,
  useModelEvents,
  useInstanceModel,
  useInstanceDefaults,
  useInstanceFeathers,
} from './use-base-model'

// Hooks for Composition Models and Stores
export { syncStore, setPending, normalizeFind, eventLocks, skipGetIfExists, makeModelInstances } from './hooks'

// Associations
export { associateFind } from './associate-find'
export { associateGet } from './associate-get'

export { OFetch } from './feathers-ofetch'
export { models } from './models'
export { clients, registerClient } from './clients'

// Utils
export { Find, useFind } from './use-find'
export { Get, useGet } from './use-get'
export { useFindWatched } from './use-find-watched'
export { useGetWatched } from './use-get-watched'
export { usePagination } from './use-pagination'
export { useClones } from './use-clones'
export { useClone } from './use-clone'

// Storage Sync
export { syncWithStorage } from './storage-sync'
export { clearStorage } from './clear-storage'

// Types
export * from './types'
export * from './service-store/types'
export * from './use-base-model/types'
