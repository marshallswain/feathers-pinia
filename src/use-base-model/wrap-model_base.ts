// import { useService } from '../use-service'
import type { AnyData } from '../service-store'
import { useServiceLocal } from '../use-service'
import { useAllStorageTypes } from '../use-service/use-all-storage-types'
import { ref } from 'vue-demi'
import type { InferReturn, ModelInstanceData, UseBaseModelOptions } from './types'

/**
 * Adds the useService utilities to the ModelFn
 * @param ModelFn
 * @returns ModelFn
 */
export const wrapModelBase = <M extends AnyData, Q extends AnyData, Func extends (data: ModelInstanceData<M>) => any>(
  options: UseBaseModelOptions,
  ModelFn: Func,
): {
  (data: ModelInstanceData<M>): InferReturn<Func>
  // test: boolean
} => {
  const _ModelFn = ModelFn as Func & { setStore: (store: any) => void; store: any }

  // Add a `setStore` property to the ModelFn
  const setStore = (store: any) => (_ModelFn.store = store)
  Object.assign(_ModelFn, { setStore })

  const storage = useAllStorageTypes<M, Func>({ ModelFn })

  // local data filtering
  const { findInStore, countInStore, getFromStore } = useServiceLocal<M, Q>({
    idField: ref(options.idField),
    itemStorage: storage.itemStorage,
    tempStorage: storage.tempStorage,
    whitelist: ref(options.whitelist || []),
    paramsForServer: ref(options.paramsForServer || []),
  })

  // Setup the default store.
  const store = {
    ...storage,
    findInStore,
    countInStore,
    getFromStore,
  }
  _ModelFn.setStore(store)

  // Create getters for renamed fields
  const renamedFields = {
    get itemsById() {
      return _ModelFn.store.itemStorage.byId
    },
    get items() {
      return _ModelFn.store.itemStorage.list
    },
    get itemIds() {
      return _ModelFn.store.itemStorage.ids
    },
    get tempsById() {
      return _ModelFn.store.tempStorage.byId
    },
    get temps() {
      return _ModelFn.store.tempStorage.list
    },
    get tempIds() {
      return _ModelFn.store.tempStorage.ids
    },
    get clonesById() {
      return _ModelFn.store.cloneStorage.byId
    },
    get clones() {
      return _ModelFn.store.cloneStorage.list
    },
    get cloneIds() {
      return _ModelFn.store.cloneStorage.ids
    },
  }
  Object.assign(ModelFn, renamedFields)

  // create getters for other store properties
  const fieldNames = ['additionalFields', 'clone', 'commit', 'reset', 'addToStore', 'removeFromStore', 'clearAll']
  fieldNames.forEach((field) => {
    Object.defineProperty(_ModelFn, field, {
      configurable: true,
      get() {
        return _ModelFn.store[field]
      },
    })
  })

  return ModelFn as Func & {
    setStore: typeof setStore
    store: any
    // ReturnType<typeof useService>
  } & typeof renamedFields
}
