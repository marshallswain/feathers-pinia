import type { Query } from '@feathersjs/feathers'

import { computed, unref } from 'vue-demi'
import type { AnyData } from '../types'
import { MaybeRef } from '@vueuse/core'
import type { HandleEvents } from './types'
import { useServiceLocal } from './local-queries'

import { useServicePagination } from './pagination'
import { useServicePending } from './pending'
import { useServiceEventLocks } from './event-locks'
import { useAllStorageTypes } from './all-storage-types'

export interface UseServiceOptions<M extends AnyData> {
  idField: string
  whitelist?: string[]
  paramsForServer?: string[]
  skipGetIfExists?: boolean
  ssr?: MaybeRef<boolean>
  handleEvents?: HandleEvents<M>
  debounceEventsTime?: number
  debounceEventsGuarantee?: boolean
  customSiftOperators?: Record<string, any>
}

const makeDefaultOptions = () => ({
  skipGetIfExists: false,
})

export const useDataStore = <M extends AnyData, Q extends Query>(_options: UseServiceOptions<M>) => {
  const options = Object.assign({}, makeDefaultOptions(), _options)
  const { idField, whitelist, paramsForServer, customSiftOperators } = options

  // pending state
  const pendingState = useServicePending()

  // storage
  const { itemStorage, tempStorage, cloneStorage, clone, commit, reset, removeFromStore, addToStore } =
    useAllStorageTypes<M>({
      getIdField: (val: AnyData) => val[idField],
    })

  const isSsr = computed(() => {
    const ssr = unref(options.ssr)
    return !!ssr
  })

  // pagination
  const { pagination, clearPagination, updatePaginationForQuery, unflagSsr } = useServicePagination({
    idField,
    isSsr,
  })

  function clearAll() {
    itemStorage.clear()
    tempStorage.clear()
    cloneStorage.clear()
    clearPagination()
    pendingState.clearAllPending()
  }

  // local data filtering
  const { findInStore, countInStore, getFromStore, removeByQuery } = useServiceLocal<M, Q>({
    idField,
    itemStorage,
    tempStorage,
    cloneStorage,
    removeFromStore,
    whitelist,
    paramsForServer,
    customSiftOperators,
  })

  // event locks
  const eventLocks = useServiceEventLocks()

  const store = {
    idField,
    whitelist,
    paramsForServer,
    isSsr,

    // items
    itemsById: itemStorage.byId,
    items: itemStorage.list,
    itemIds: itemStorage.ids,

    // temps
    tempsById: tempStorage.byId,
    temps: tempStorage.list,
    tempIds: tempStorage.ids,

    // clones
    clonesById: cloneStorage.byId,
    clones: cloneStorage.list,
    cloneIds: cloneStorage.ids,
    clone,
    commit,
    reset,

    // options
    pagination,
    updatePaginationForQuery,
    unflagSsr,

    // local queries
    findInStore,
    countInStore,
    getFromStore,
    removeFromStore,
    removeByQuery,
    addToStore,
    clearAll,

    ...pendingState,
    ...eventLocks,
  }

  return store
}
