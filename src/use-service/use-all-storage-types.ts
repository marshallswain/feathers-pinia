import type { MakeCopyOptions, ModelInstance } from '../use-base-model'
import type { AnyData } from './types'
import { useServiceTemps } from './use-service-temps'
import { useServiceClones } from './use-service-clones'
import { useServiceStorage } from './use-service-storage'
import { getArray } from '../utils'
import fastCopy from 'fast-copy'
import { del } from 'vue-demi'

interface UseAllStorageOptions<M extends AnyData, Func extends (data: ModelInstance<M>) => any> {
  ModelFn: Func
  /**
   * A callback after clearing the store. Allows loose coupling of other functionality, like clones.
   */
  afterClear?: () => void
}

export const useAllStorageTypes = <M extends AnyData, Func extends (data: ModelInstance<M>) => any>(
  options: UseAllStorageOptions<M, Func>,
) => {
  const { ModelFn, afterClear } = options
  const additionalFields: string[] = []

  // Make sure the provided item is a model "instance" (in quotes because it's not a class)
  const assureInstance = (item: AnyData) =>
    item.__modelName ? item : ModelFn ? ModelFn(item as ModelInstance<M>) : item

  /**
   * Makes a copy of the Model instance with __isClone properly set
   * Private
   */
  const makeCopy = (item: M, data: AnyData = {}, { isClone }: MakeCopyOptions) => {
    const copied = item.__Model({
      ...fastCopy(item),
      ...data,
      __isClone: isClone,
      __tempId: item.__tempId,
    })
    return copied
  }

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
    makeCopy,
    beforeWrite: (item) => {
      markAsClone(item)
      return assureInstance(item)
    },
  })

  /**
   * Stores the provided item in the correct storage (itemStorage, tempStorage, or cloneStorage).
   * If an item has both an id and a tempId, it gets moved from tempStorage to itemStorage.
   * Private
   */
  const addItemToStorage = (item: M) => {
    if (item.__isClone) {
      return cloneStorage.merge(item)
    } else if (item[item.__idField] != null && item.__tempId != null) {
      return moveTempToItems(item)
    } else if (item[item.__idField] != null) {
      return itemStorage.merge(item)
    } else if (tempStorage && item.__tempId != null) {
      return tempStorage?.merge(item)
    }
    return itemStorage.merge(item)
  }

  /**
   * An alias for addOrUpdate
   * @param data a single record or array of records.
   * @returns data added or modified in the store. If you pass an array, you get an array back.
   */
  function addToStore(data: M | M[]) {
    const { items, isArray } = getArray(data)

    const _items = items.map((item: M) => {
      const stored = addItemToStorage(item)
      return stored
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
  }
}
