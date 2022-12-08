import { useServiceTemps } from './use-service-temps'
import { useServiceClones } from './use-service-clones'
import { useServiceStorage } from './use-service-storage'
import { AnyData, AnyDataOrArray } from './types'
import { del } from 'vue-demi'
import type { ModelFnType } from '../use-base-model'
import { MaybeArray } from '../utility-types'
import { getArray } from '../utils'

interface UseAllStorageOptions<M extends AnyData> {
  ModelFn: ModelFnType<M>
  /**
   * A callback after clearing the store. Allows loose coupling of other functionality, like clones.
   */
  afterClear?: () => void
}

export const useAllStorageTypes = <M extends AnyData>(options: UseAllStorageOptions<M>) => {
  const { ModelFn, afterClear } = options
  const additionalFields: string[] = []

  // Make sure the provided item is a model "instance" (in quotes because it's not a class)
  const assureInstance = (item: M) => (item.__modelName ? item : ModelFn ? ModelFn(item) : item)

  // item storage
  const itemStorage = useServiceStorage<M>({
    getId: (item) => item[item.__idField],
    onRead: assureInstance,
    beforeWrite: assureInstance,
  })

  // temp item storage
  const { tempStorage, moveTempToItems } = useServiceTemps<M>({
    getId: (item) => item.__tempId,
    removeId: (item) => del(item, '__tempId'),
    itemStorage,
    onRead: assureInstance,
    beforeWrite: assureInstance,
  })

  // clones
  const { cloneStorage, clone, commit, reset, markAsClone } = useServiceClones<M>({
    itemStorage,
    tempStorage,
    onRead: assureInstance,
    beforeWrite: (item) => {
      markAsClone(item)
      return assureInstance(item)
    },
  })

  /**
   * Stores the provided item in the correct storage (itemStorage, tempStorage, or cloneStorage).
   * If an item has both an id and a tempId, it gets moved from tempStorage to itemStorage.
   * @param item
   */
  const addToStorage = (item: M) => {
    if (item.__isClone) {
      return cloneStorage.merge(item)
    } else if (item[item.__idField] != null && item.__tempId != null) {
      return moveTempToItems(item)
    } else if (item[item.__idField] != null) {
      return itemStorage.merge(item)
    } else if (tempStorage && item.__tempId != null) {
      return tempStorage?.merge(item)
    }
  }

  /**
   * An alias for addOrUpdate
   * @param data a single record or array of records.
   * @returns data added or modified in the store. If you pass an array, you get an array back.
   */
  function addToStore<N extends M>(data: M): N
  function addToStore<N extends M>(data: N[]): N[]
  function addToStore<N extends M>(data: AnyDataOrArray<N>): MaybeArray<N> {
    const { items, isArray } = getArray(data)

    const _items = items.map((item: N) => {
      const stored = addToStorage(item)
      return stored as N
    })

    return isArray ? _items : _items[0]
  }

  /**
   * Removes item from all stores (items, temps, clones).
   * Reactivity in Vue 3 might be fast enough to just remove each item and not batch.
   * @param data
   */
  function removeFromStore(data: M | M[]) {
    const { items } = getArray(data)
    items.forEach((item: M) => {
      itemStorage.remove(item)
      tempStorage.remove(item)
      cloneStorage.remove(item)
    })
    return data
  }

  function clearAll() {
    itemStorage.clear()
    tempStorage.clear()
    cloneStorage.clear()
    afterClear && afterClear()
  }

  function hydrateAll() {
    addToStore(itemStorage.list.value)
  }

  return {
    additionalFields,
    itemStorage,
    tempStorage,
    cloneStorage,
    clone,
    commit,
    reset,
    addToStore,
    removeFromStore,
    clearAll,
    hydrateAll,
  }
}
