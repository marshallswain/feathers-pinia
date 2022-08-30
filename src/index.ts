export { setupFeathersPinia } from './setup'
export { defineStore } from './service-store/define-store'
export { defineAuthStore } from './define-auth-store'
export { makeServiceStore, BaseModel } from './service-store/index'
export { makeState } from './service-store/make-state'

export { models } from './models'
export { clients, registerClient } from './clients'

export { useFind } from './use-find'
export { useGet } from './use-get'
export { useClones } from './use-clones'
export { useClones as handleClones } from './use-clones'
export { usePagination } from './use-pagination'

export { syncWithStorage } from './storage-sync'
export { syncWithStorageCompressed } from './storage-sync-compressed'
export { clearStorage } from './clear-storage'

export * from './types'
export * from './service-store/types'
