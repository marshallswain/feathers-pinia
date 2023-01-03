import type { BaseModelStatic, InferReturn, ModelInstanceData, UseBaseModelOptions } from './types'
import { type AnyData, useServiceLocal } from '../use-service'
import { useAllStorageTypes } from '../use-service/use-all-storage-types'
import { reactive, ref } from 'vue-demi'

/**
 * Adds the useService utilities to the Model
 * @param Model
 * @returns Model
 */
export const wrapModelBase = <M extends AnyData, Q extends AnyData, Func extends (data: ModelInstanceData<M>) => any>(
  options: UseBaseModelOptions,
  Model: Func,
): {
  (data: ModelInstanceData<M>): InferReturn<Func>
} & BaseModelStatic<M, Q> => {
  const _Model = Model as Func & BaseModelStatic<M, Q>
  const whitelist = ref(options.whitelist || [])
  const idField = ref(options.idField)

  // Add a `setStore` property to the Model
  const setStore = (store: any) => {
    _Model.store = store
    if (store.setModel) {
      store.setModel(_Model)
    }
  }
  Object.assign(_Model, { setStore })

  const storage = useAllStorageTypes<M, Func>({ getModel: () => Model })

  // local data filtering
  const { findInStore, countInStore, getFromStore, associations } = useServiceLocal<M, Q>({
    idField,
    itemStorage: storage.itemStorage,
    tempStorage: storage.tempStorage,
    whitelist,
  })

  // Setup the default store, matching a subset of the pinia store structure
  const store = reactive({
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
    idField,
    associations,
    whitelist,
  })
  _Model.setStore(store)

  // Add getters for key methods
  Object.assign(Model, {
    get findInStore() {
      return _Model.store.findInStore
    },
    get countInStore() {
      return _Model.store.countInStore
    },
    get getFromStore() {
      return _Model.store.getFromStore
    },
    get addToStore() {
      return _Model.store.addToStore
    },
    get removeFromStore() {
      return _Model.store.removeFromStore
    },
  })

  _Model.associations = {}

  return Model as Func & BaseModelStatic<M, Q>
}
