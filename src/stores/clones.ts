import { del as vueDelete } from 'vue-demi'
import fastCopy from 'fast-copy'
import type { AnyData, MakeCopyOptions } from '../types.js'
import type { CloneOptions, beforeWriteFn, onReadFn } from './types.js'
import type { StorageMapUtils } from './storage.js'
import { useServiceStorage } from './storage.js'

export interface UseServiceClonesOptions<M extends AnyData> {
  itemStorage: StorageMapUtils<M>
  tempStorage: StorageMapUtils<M>
  onRead?: onReadFn<M>
  beforeWrite?: beforeWriteFn<M>
  makeCopy?: (item: M, data: AnyData, { isClone }: MakeCopyOptions) => M
}

export function useServiceClones<M extends AnyData>(options: UseServiceClonesOptions<M>) {
  const { itemStorage, tempStorage, onRead, beforeWrite } = options
  const defaultMakeCopy = (item: M, data: AnyData = {}, { isClone }: MakeCopyOptions) => {
    return fastCopy(Object.assign({}, item, data, { __isClone: isClone }))
  }
  const makeCopy = options.makeCopy || defaultMakeCopy

  const cloneStorage = useServiceStorage({
    getId: (item) => {
      const id = itemStorage.getId(item as M)
      return id != null ? id : tempStorage.getId(item)
    },
    onRead,
    beforeWrite,
  })

  /**
   * Makes sure the provided item is stored in itemStorage or tempStorage.
   * Private
   */
  function assureOriginalIsStored(item: M): M {
    // Make sure the stored version is always up to date with the latest instance data. (the instance used to call instance.clone)
    if (!item.__isClone) {
      if (itemStorage.has(item))
        itemStorage.merge(item)
      else if (tempStorage.has(item))
        tempStorage.merge(item)
    }
    const existingItem = itemStorage.get(item) || tempStorage.get(item)
    if (!existingItem) {
      if (itemStorage.getId(item) != null)
        itemStorage.merge(item)
      else if (tempStorage.getId(item) != null)
        tempStorage.merge(item)
    }
    return itemStorage.get(item) || tempStorage.get(item)
  }

  /**
   * Fast-copies the provided `item`, placing it in `cloneStorage`.
   * @param item the object to clone.
   * @param data an object to be merged before storing in cloneStorage.
   * @param options.useExisting {Boolean} allows using the existing clone instead of re-cloning.
   * @returns
   */
  function clone(item: M, data = {}, options: CloneOptions = {}): M {
    const existingClone = cloneStorage.get(item)

    assureOriginalIsStored(item)

    if (existingClone && options.useExisting) {
      return existingClone as M
    }
    else {
      const clone = reset(item, data)
      return clone as M
    }
  }

  /**
   * If the `item` has an id, it's merged or written to the itemStore.
   * If the `item` does not have an id, it's merged or written to the tempStore.
   * @param item
   * @param data
   * @returns stored item or stored temp
   */
  function commit(item: M, data: Partial<M> = {}) {
    const itemId = itemStorage.getId(item)
    const _item = makeCopy(item, data, { isClone: false })
    // copyAssociations(clone, newOriginal, clone.getModel().associations)
    if (itemId) {
      itemStorage.merge(_item)
      return itemStorage.get(_item)
    }
    else {
      tempStorage.merge(_item)
      return tempStorage.get(_item)
    }
  }

  /**
   * If a clone exists, resets the clone to match the item or temp
   * If a clone does not exist, writes the item as the clone.
   * @param item
   * @param data
   * @returns
   */
  function reset(item: M, data = {}): M {
    const original = assureOriginalIsStored(item)
    const existingClone = cloneStorage.get(item)

    if (existingClone) {
      const copied = makeCopy(original, data, { isClone: true })
      Object.keys(original).forEach((key) => {
        if (original[key] == null)
          vueDelete(copied, key)
      })
      cloneStorage.merge(copied)
    }
    else {
      const copied = makeCopy(item, data, { isClone: true })
      cloneStorage.set(copied)
    }
    return cloneStorage.get(item)
  }

  function markAsClone(item: M) {
    Object.defineProperty(item, '__isClone', {
      writable: false,
      enumerable: false,
      value: true,
    })
    return item
  }

  return {
    cloneStorage,
    clone,
    commit,
    reset,
    markAsClone,
  }
}
