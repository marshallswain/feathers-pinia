// Composition Stores
export { useAuth } from './use-auth'
export {
  useService,
  type UseServiceOptions,
  type UseServiceOptionsExtended,
  useServiceLocal,
  useServiceTemps,
  useServiceEvents,
  useServiceClones,
  useServicePending,
  useServiceStorage,
  useAllStorageTypes,
  useServiceEventLocks,
  useServicePagination,
  useServiceApiFeathers,
} from './use-service/'

// Composition Models
export {
  useBaseModel,
  useFeathersModel,
  useModelEvents,
  wrapModelBase,
  wrapModelFeathers,
  useModelInstance,
  useInstanceDefaults,
  useFeathersInstance,
} from './use-base-model'

// Hooks for Composition Models and Stores
export {
  syncStore,
  setPending,
  normalizeFind,
  eventLocks,
  skipGetIfExists,
  makeModelInstances,
  feathersPiniaHooks,
} from './hooks'

// Associations
export { associateFind } from './associate-find'
export { associateGet } from './associate-get'

export { OFetch } from './feathers-ofetch'

// Utils
export { useFind } from './use-find'
export { useGet } from './use-get'
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
export * from './use-base-model/types'
