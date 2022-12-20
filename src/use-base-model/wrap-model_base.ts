import type { BaseModelStatic, InferReturn, ModelInstanceData, UseBaseModelOptions } from './types'
import type { AnyData } from '../service-store'
import { useServiceLocal } from '../use-service'
import { useAllStorageTypes } from '../use-service/use-all-storage-types'
import { reactive, ref } from 'vue-demi'

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
} & BaseModelStatic<M, Q> => {
  const _ModelFn = ModelFn as Func & BaseModelStatic<M, Q>
  const whitelist = ref(options.whitelist || [])
  const paramsForServer = ref(options.paramsForServer || [])

  // Add a `setStore` property to the ModelFn
  const setStore = (store: any) => (_ModelFn.store = store)
  Object.assign(_ModelFn, { setStore })

  const storage = useAllStorageTypes<M, Func>({ ModelFn })

  // local data filtering
  const { findInStore, countInStore, getFromStore, associations } = useServiceLocal<M, Q>({
    idField: ref(options.idField),
    itemStorage: storage.itemStorage,
    tempStorage: storage.tempStorage,
    whitelist,
    paramsForServer,
  })

  // Setup the default store, matching a subset of the pinia store structure
  const store = reactive({
    additionalFields: [],
    itemsById: storage.itemStorage.byId,
    items: storage.itemStorage.list,
    itemIds: storage.itemStorage.ids,
    tempsById: storage.tempStorage.byId,
    temps: storage.tempStorage.list,
    tempIds: storage.tempStorage.ids,
    clonesById: storage.cloneStorage.byId,
    clones: storage.cloneStorage.list,
    cloneIds: storage.cloneStorage.ids,
    clone: storage.clone,
    commit: storage.commit,
    reset: storage.reset,
    addToStore: storage.addToStore,
    removeFromStore: storage.removeFromStore,
    clearAll: storage.clearAll,
    findInStore,
    countInStore,
    getFromStore,
    associations,
    whitelist,
    paramsForServer,
  })
  _ModelFn.setStore(store)

  // Add getters for key methods
  Object.assign(ModelFn, {
    get findInStore() {
      return _ModelFn.store.findInStore
    },
    get countInStore() {
      return _ModelFn.store.countInStore
    },
    get getFromStore() {
      return _ModelFn.store.getFromStore
    },
    get addToStore() {
      return _ModelFn.store.addToStore
    },
    get removeFromStore() {
      return _ModelFn.store.removeFromStore
    },
  })

  _ModelFn.associations = {}

  return ModelFn as Func & BaseModelStatic<M, Q>
}
