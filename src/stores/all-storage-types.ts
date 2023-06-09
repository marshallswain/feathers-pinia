import type { AnyData, MakeCopyOptions } from '../types.js'
import fastCopy from 'fast-copy'
import { defineValues } from '../utils/index.js'
import { useServiceTemps } from './temps.js'
import { useServiceClones } from './clones.js'
import { useServiceStorage } from './storage.js'

interface UseAllStorageOptions {
  getIdField: (val: AnyData) => any
  setupInstance: any
}

export const useAllStorageTypes = <M extends AnyData>(
  options: UseAllStorageOptions
) => {
  const { getIdField, setupInstance } = options

  /**
   * Makes a copy of the Model instance with __isClone properly set
   * Private
   */
  const makeCopy = (
    item: M,
    data: AnyData = {},
    { isClone }: MakeCopyOptions
  ) => {
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
    const withExtras = defineValues(copied, {
      __isClone: isClone,
      __tempId: item.__tempId,
    })
    return withExtras
  }

  // item storage
  const itemStorage = useServiceStorage<M>({
    getId: getIdField,
    beforeWrite: setupInstance,
    onRead: setupInstance,
  })

  // temp item storage
  const { tempStorage, moveTempToItems } = useServiceTemps<M>({
    getId: (item) => item.__tempId,
    itemStorage,
    beforeWrite: setupInstance,
    onRead: setupInstance,
  })

  // clones
  const { cloneStorage, clone, commit, reset, markAsClone } =
    useServiceClones<M>({
      itemStorage,
      tempStorage,
      makeCopy,
      beforeWrite: (item) => {
        markAsClone(item)
        return setupInstance(item)
      },
      onRead: setupInstance,
    })

  /**
   * Stores the provided item in the correct storage (itemStorage, tempStorage, or cloneStorage).
   * If an item has both an id and a tempId, it gets moved from tempStorage to itemStorage.
   * Private
   */
  const addItemToStorage = (item: M) => {
    const id = getIdField(item)
    item = setupInstance(item)

    if (item.__isClone) return cloneStorage.merge(item)
    else if (id != null && item.__tempId != null) return moveTempToItems(item)
    else if (id != null) return itemStorage.merge(item)
    else if (tempStorage && item.__tempId != null)
      return tempStorage?.merge(item)

    return itemStorage.merge(item)
  }

  return {
    itemStorage,
    tempStorage,
    cloneStorage,
    clone,
    commit,
    reset,
    addItemToStorage,
  }
}
