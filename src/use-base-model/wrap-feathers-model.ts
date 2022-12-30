import type { AnyData } from '../service-store'
import type { FeathersModelStatic, ModelInstanceData, UseFeathersModelOptions } from './types'
import { useService } from '../use-service'
import { reactive } from 'vue-demi'

/**
 * Adds the useService utilities to the ModelFn
 * @param ModelFn
 * @returns ModelFn
 */
export const wrapModelFeathers = <
  M extends AnyData,
  D extends AnyData,
  Q extends AnyData,
  ModelFunc extends (data: ModelInstanceData<M>) => any,
>(
  options: UseFeathersModelOptions,
  ModelFn: ModelFunc,
) => {
  const _ModelFn = ModelFn as ModelFunc & FeathersModelStatic<M, D, Q, ModelFunc>
  const { service } = options

  Object.assign(ModelFn, { service })

  // Add a `setStore` property to the ModelFn
  const setStore = (store: any) => (_ModelFn.store = store)
  Object.assign(_ModelFn, { setStore })

  // Initialize `useService` as the default store. It can be replaced by calling `ModelFn.setStore(store)`
  const store = useService<M, D, Q, typeof _ModelFn>({ ...options, ModelFn: _ModelFn })
  _ModelFn.setStore(reactive(store))

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
    get find() {
      return _ModelFn.store.find
    },
    get count() {
      return _ModelFn.store.count
    },
    get get() {
      return _ModelFn.store.get
    },
    get create() {
      return _ModelFn.store.create
    },
    get update() {
      return _ModelFn.store.update
    },
    get patch() {
      return _ModelFn.store.patch
    },
    get remove() {
      return _ModelFn.store.remove
    },
    get useFind() {
      return _ModelFn.store.useFind
    },
    get useGet() {
      return _ModelFn.store.useGet
    },
    get useGetOnce() {
      return _ModelFn.store.useGetOnce
    },
    get useFindWatched() {
      return _ModelFn.store.useFindWatched
    },
    get useGetWatched() {
      return _ModelFn.store.useGetWatched
    },
  })

  _ModelFn.associations = {}

  return ModelFn as ModelFunc & FeathersModelStatic<M, D, Q, ModelFunc>
}
