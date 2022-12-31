import type { AnyData } from '../service-store'
import type { FeathersModelStatic, ModelInstanceData, UseFeathersModelOptions } from './types'
import { useService } from '../use-service'
import { reactive } from 'vue-demi'

/**
 * Adds the useService utilities to the Model
 * @param Model
 * @returns Model
 */
export const wrapModelFeathers = <
  M extends AnyData,
  D extends AnyData,
  Q extends AnyData,
  ModelFunc extends (data: ModelInstanceData<M>) => any,
>(
  options: UseFeathersModelOptions,
  Model: ModelFunc,
) => {
  const _Model = Model as ModelFunc & FeathersModelStatic<M, D, Q, ModelFunc>
  const { service } = options

  Object.assign(Model, { service })

  // Add a `setStore` property to the Model
  const setStore = (store: any) => (_Model.store = store)
  Object.assign(_Model, { setStore })

  // Initialize `useService` as the default store. It can be replaced by calling `Model.setStore(store)`
  const store = useService<M, D, Q, typeof _Model>({ ...options, Model: _Model })
  _Model.setStore(reactive(store))

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
    get find() {
      return _Model.store.find
    },
    get count() {
      return _Model.store.count
    },
    get get() {
      return _Model.store.get
    },
    get create() {
      return _Model.store.create
    },
    get update() {
      return _Model.store.update
    },
    get patch() {
      return _Model.store.patch
    },
    get remove() {
      return _Model.store.remove
    },
    get useFind() {
      return _Model.store.useFind
    },
    get useGet() {
      return _Model.store.useGet
    },
    get useGetOnce() {
      return _Model.store.useGetOnce
    },
    get useFindWatched() {
      return _Model.store.useFindWatched
    },
    get useGetWatched() {
      return _Model.store.useGetWatched
    },
  })

  _Model.associations = {}

  return Model as ModelFunc & FeathersModelStatic<M, D, Q, ModelFunc>
}
