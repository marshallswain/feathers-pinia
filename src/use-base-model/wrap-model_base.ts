// import { useService } from '../use-service'
import type { AnyData } from '../service-store'
import type { InferReturn, ModelInstanceData, UseBaseModelOptions } from './types'

/**
 * Adds the useService utilities to the ModelFn
 * @param ModelFn
 * @returns ModelFn
 */
export const wrapModelBase = <M extends AnyData, Func extends (data: ModelInstanceData<M>) => any>(
  options: UseBaseModelOptions,
  ModelFn: Func,
): {
  (data: ModelInstanceData<M>): InferReturn<Func>
  // test: boolean
} => {
  const _ModelFn = ModelFn as Func & { setStore: (store: any) => void; store: any }

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
  const store: any = {}
  // const store = useService({ ...options, ModelFn: _ModelFn })
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

  // create getters for other store properties
  const fieldNames = ['additionalFields', 'clone', 'commit', 'reset', 'addToStore', 'clearAll']
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
  }
}
