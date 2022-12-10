import { UseServiceOptions, useService } from '../use-service'
import type { AnyData } from '../service-store'
import type { ModelFnTypeExtended } from './types'

/**
 * Adds the useService utilities to the ModelFn
 * @param ModelFn
 * @returns ModelFn
 */
export const wrapModelFeathers = <M extends AnyData, F extends ModelFnTypeExtended<M>>(
  ModelFn: F,
  options: UseServiceOptions<M>,
) => {
  const _ModelFn = ModelFn as F & { setStore: (store: any) => void; store: any }

  // Add a `setStore` property to the ModelFn
  const setStore = (store: any) => {
    Object.defineProperty(_ModelFn, 'store', {
      configurable: true,
      value: store,
    })
  }
  Object.defineProperties(_ModelFn, {
    setServiceProps: {
      configurable: true,
      value: setStore,
    },
  })

  // Initialize `useService` as the default store. It can be replaced by calling `ModelFn.setStore(store)`
  const store = useService({ ...options, ModelFn: _ModelFn })
  _ModelFn.setStore(store)

  // Create getters for renamed fields
  const renamedFields = {
    itemsById() {
      return _ModelFn.store.itemStorage.byId
    },
    items() {
      return _ModelFn.store.itemStorage.list
    },
    itemIds() {
      return _ModelFn.store.itemStorage.ids
    },
    tempsById() {
      return _ModelFn.store.tempStorage.byId
    },
    temps() {
      return _ModelFn.store.tempStorage.list
    },
    tempIds() {
      return _ModelFn.store.tempStorage.ids
    },
    clonesById() {
      return _ModelFn.store.cloneStorage.byId
    },
    clones() {
      return _ModelFn.store.cloneStorage.list
    },
    cloneIds() {
      return _ModelFn.store.cloneStorage.ids
    },
  }
  Object.entries(renamedFields).forEach(([key, value]) => {
    Object.defineProperty(_ModelFn, key, { get: value })
  })

  // create getter fields for other store fields
  const fieldNames = [
    'additionalFields',
    'whitelist',
    'paramsForServer',
    'skipRequestIfExists',
    'isSsr',
    'idField',
    'clone',
    'commit',
    'reset',
    'pagination',
    'updatePaginationForQuery',
    'unflagSsr',
    'findInStore',
    'countInStore',
    'getFromStore',
    'removeFromStore',
    'addToStore',
    'clearAll',
    'isPending',
    'createPendingById',
    'updatePendingById',
    'patchPendingById',
    'removePendingById',
    'isFindPending',
    'isCountPending',
    'isGetPending',
    'isCreatePending',
    'isUpdatePending',
    'isPatchPending',
    'isRemovePending',
    'setPending',
    'setPendingById',
    'unsetPendingById',
    'clearAllPending',
    'eventLocks',
    'toggleEventLock',
    'clearEventLock',
    'find',
    'count',
    'get',
    'create',
    'update',
    'patch',
    'remove',
    'useFind',
    'useGet',
    'useGetOnce',
    'useFindWatched',
    'useGetWatched',
  ]
  fieldNames.forEach((field) => {
    Object.defineProperty(_ModelFn, field, {
      configurable: true,
      get() {
        return _ModelFn.store[field]
      },
    })
  })

  return ModelFn as F & { setStore: typeof setStore; store: ReturnType<typeof useService> }
}
