import type { AnyData } from '../types'
import type { MakeCopyOptions } from '../types'
import fastCopy from 'fast-copy'
import { defineProperties, getArray } from '../utils'
import { useServiceTemps } from './temps'
import { useServiceClones } from './clones'
import { useServiceStorage } from './storage'

interface UseAllStorageOptions {
  getIdField: (val: AnyData) => any
}

export const useAllStorageTypes = <M extends AnyData>(options: UseAllStorageOptions) => {
  const { getIdField } = options

  /**
   * Makes a copy of the Model instance with __isClone properly set
   * Private
   */
  const makeCopy = (item: M, data: AnyData = {}, { isClone }: MakeCopyOptions) => {
    const copied = fastCopy(item)
    Object.assign(copied, data)
    // instance.__isTemp
    Object.defineProperty(copied, '__isTemp', {
      configurable: true,
      enumerable: false,
      get() {
        return this[this.__idField] == null
      },
    })
    const withExtras = defineProperties(copied, {
      __isClone: isClone,
      __tempId: item.__tempId,
    })
    return withExtras
  }

  // item storage
  const itemStorage = useServiceStorage<M>({
    getId: getIdField,
  })

  // temp item storage
  const { tempStorage, moveTempToItems } = useServiceTemps<M>({
    getId: (item) => item.__tempId,
    itemStorage,
  })

  // clones
  const { cloneStorage, clone, commit, reset, markAsClone } = useServiceClones<M>({
    itemStorage,
    tempStorage,
    makeCopy,
    beforeWrite: (item) => {
      markAsClone(item)
      return item
    },
  })

  /**
   * Stores the provided item in the correct storage (itemStorage, tempStorage, or cloneStorage).
   * If an item has both an id and a tempId, it gets moved from tempStorage to itemStorage.
   * Private
   */
  const addItemToStorage = (item: M) => {
    const id = getIdField(item)

    if (item.__isClone) return cloneStorage.merge(item)
    else if (id != null && item.__tempId != null) return moveTempToItems(item)
    else if (id != null) return itemStorage.merge(item)
    else if (tempStorage && item.__tempId != null) return tempStorage?.merge(item)

    return itemStorage.merge(item)
  }

  /**
   * An alias for addOrUpdate
   * @param data a single record or array of records.
   * @returns data added or modified in the store. If you pass an array, you get an array back.
   */
  function addToStore(data: AnyData | AnyData[]): AnyData | AnyData[] {
    const { items, isArray } = getArray(data)

    const _items = items.map((item: AnyData) => {
      const stored = addItemToStorage(item as any)
      return stored
    })

    return isArray ? _items : _items[0]
  }

  /**
   * If a clone is provided, it removes the clone from the store.
   * If a temp is provided, it removes the temp from the store.
   * If an item is provided, the item and its associated temp and clone are removed.
   * If a string is provided, it removes any item, temp, or clone from the stores.
   * @param data
   */
  function removeFromStore(data: M | M[]) {
    const { items } = getArray(data)
    items.forEach((item: M) => {
      if (typeof item === 'string') {
        itemStorage.removeItem(item)
        tempStorage.removeItem(item)
        cloneStorage.removeItem(item)
      } else {
        if ((item as M).__isClone) return cloneStorage.remove(item as M)

        if ((item as M).__isTemp) return tempStorage.remove(item as M)

        itemStorage.remove(item)
        tempStorage.remove(item)
        cloneStorage.remove(item)
      }
    })
    return data
  }

  return {
    itemStorage,
    tempStorage,
    cloneStorage,
    clone,
    commit,
    reset,
    addToStore,
    removeFromStore,
  }
}
