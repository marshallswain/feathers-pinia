export { setupFeathersPinia } from './setup'
export { defineStore, BaseModel } from './service-store'
export { defineAuthStore } from './define-auth-store'
export { associateFind } from './associate-find'
export { associateGet } from './associate-get'

export { models } from './models'
export { clients, registerClient } from './clients'
export { OFetch } from './feathers-ofetch'

export { Find, useFind } from './use-find'
export { Get, useGet } from './use-get'
export { useFindWatched } from './use-find-watched'
export { useGetWatched } from './use-get-watched'
export { usePagination } from './use-pagination'
export { useClones } from './use-clones'
export { useClone } from './use-clone'
export { useAuth } from './use-auth'

export { syncWithStorage } from './storage-sync'
export { clearStorage } from './clear-storage'

export * from './types'
export * from './service-store/types'
