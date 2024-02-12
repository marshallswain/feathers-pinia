import type { Query } from '@feathersjs/feathers'

import { computed, unref } from 'vue-demi'
import type { MaybeRef } from '@vueuse/core'
import type { AnyData } from '../types.js'
import { useModelInstance } from '../modeling/use-model-instance'
import { useServiceLocal } from './local-queries.js'

import { useServicePagination } from './pagination.js'
import { useServicePending } from './pending.js'
import { useServiceEventLocks } from './event-locks.js'
import { useAllStorageTypes } from './all-storage-types.js'
import { useSsrQueryCache } from './ssr-query-cache.js'

export interface UseServiceStoreOptions {
  idField: string
  servicePath: string
  defaultLimit?: number
  whitelist?: string[]
  paramsForServer?: string[]
  skipGetIfExists?: boolean
  ssr?: MaybeRef<boolean>
  customSiftOperators?: Record<string, any>
  setupInstance?: any
}

function makeDefaultOptions() {
  return {
    skipGetIfExists: false,
  }
}

export function useServiceStore<M extends AnyData, Q extends Query>(_options: UseServiceStoreOptions) {
  const options = Object.assign({}, makeDefaultOptions(), _options)
  const { idField, servicePath, whitelist, paramsForServer, defaultLimit, customSiftOperators } = options

  // storage
  const { itemStorage, tempStorage, cloneStorage, clone, commit, reset, addItemToStorage } = useAllStorageTypes<M>({
    getIdField: (val: AnyData) => val[idField],
    setupInstance,
  })

  // local data filtering
  const { findInStore, findOneInStore, countInStore, getFromStore, createInStore, patchInStore, removeFromStore }
    = useServiceLocal<M, Q>({
      idField,
      itemStorage,
      tempStorage,
      cloneStorage,
      addItemToStorage,
      whitelist,
      paramsForServer,
      customSiftOperators,
    })

  function setupInstance<N extends M>(this: any, data: N) {
    const asBaseModel = useModelInstance(data, {
      idField,
      clonesById: cloneStorage.byId,
      clone,
      commit,
      reset,
      createInStore,
      removeFromStore,
    })

    if (data.__isSetup) {
      return asBaseModel
    }
    else {
      const afterSetup = options.setupInstance ? options.setupInstance(asBaseModel) : asBaseModel
      Object.defineProperty(afterSetup, '__isSetup', { value: true })
      return afterSetup
    }
  }

  // pending state
  const pendingState = useServicePending()

  const isSsr = computed(() => {
    const ssr = unref(options.ssr)
    return !!ssr
  })

  // pagination
  const { pagination, clearPagination, updatePaginationForQuery, getQueryInfo, unflagSsr } = useServicePagination({
    idField,
    isSsr,
    defaultLimit,
  })

  // ssr qid cache
  const { resultsByQid, getQid, setQid, clearQid, clearAllQids } = useSsrQueryCache()

  function clearAll() {
    itemStorage.clear()
    tempStorage.clear()
    cloneStorage.clear()
    clearPagination()
    pendingState.clearAllPending()
    clearAllQids()
  }

  // event locks
  const eventLocks = useServiceEventLocks()

  const store = {
    new: setupInstance,
    idField,
    servicePath,
    isSsr,
    defaultLimit,

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

    // local queries
    findInStore,
    findOneInStore,
    countInStore,
    createInStore,
    getFromStore,
    patchInStore,
    removeFromStore,
    clearAll,

    // ssr qid cache
    resultsByQid,
    getQid,
    setQid,
    clearQid,
    clearAllQids,

    // server options
    whitelist,
    paramsForServer,

    // server pagination
    pagination,
    updatePaginationForQuery,
    unflagSsr,
    getQueryInfo,
    ...pendingState,
    ...eventLocks,
  }

  return store
}
