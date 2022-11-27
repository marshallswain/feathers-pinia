import type { AnyData } from './types'
import type { Id } from '@feathersjs/feathers'
import { ref, computed, del as vueDel, set as vueSet, type Ref } from 'vue-demi'

interface UseServiceStorageOptions<M extends AnyData> {
  getId: (item: M) => keyof M
  onRead?: (item: M) => M
  beforeWrite?: (item: M) => M
}
type ById<M> = Ref<Record<string | number | symbol, M>>
export type StorageMapUtils = ReturnType<typeof useServiceStorage>

/**
 * General storage adapter
 */
export const useServiceStorage = <M extends AnyData>({
  getId,
  onRead = (item) => item,
  beforeWrite = (item) => item,
}: UseServiceStorageOptions<M>) => {
  const byId: ById<M> = ref({})

  const list = computed(() => {
    return Object.values(byId.value)
  })

  const ids = computed(() => {
    return Object.keys(byId.value)
  })

  /**
   * Checks if the provided `item` is stored.
   * @param item
   * @returns boolean
   */
  const has = (item: M) => {
    const id = getId(item)
    return hasItem(id as Id)
  }

  /**
   * Checks if an item with the provided `id` is stored.
   * @param id
   * @returns
   */
  const hasItem = (id: Id) => {
    return !!byId.value[id]
  }

  /**
   * If the item is stored, merges the `item` into the stored version.
   * If not yet stored, the item is stored.
   * @param item the item to merge or write to the store.
   * @returns the stored item
   */
  const merge = (item: M) => {
    const id = getId(item) as Id
    const existing = getItem(id)
    if (existing) {
      Object.assign(existing, item)
    } else {
      setItem(id, item)
    }
    return getItem(id)
  }

  /**
   * Retrieves the stored record that matches the provided `item`.
   * @param item
   * @returns
   */
  const get = (item: M) => {
    const id = getId(item) as Id
    return getItem(id)
  }

  /**
   * Retrives the stored record that matches the provided `id`.
   * @param id
   * @returns
   */
  const getItem = (id: Id) => {
    const _item = onRead(byId.value[id])
    return _item as M
  }

  /**
   * Writes the provided item to the store
   * @param item item to store
   * @returns
   */
  const set = (item: M) => {
    const id = getId(item) as Id
    return setItem(id, item)
  }

  const setItem = (id: Id, item: M) => {
    if (id == null) throw new Error('item has no id')
    vueSet(byId.value, id, beforeWrite(item))
    return getItem(id)
  }

  /**
   * remove `item` if found
   * @param item
   * @returns boolean indicating if item was removed
   */
  const remove = (item: M) => {
    const id = getId(item) as Id
    return removeItem(id)
  }

  /**
   * Remove item with matching `id`, if found.
   * @param id
   * @returns boolean indicating if an item was removed
   */
  const removeItem = (id: Id) => {
    const hadItem = hasItem(id)
    if (hadItem) {
      vueDel(byId.value, id)
    }
    return hadItem
  }

  const getKeys = () => {
    return ids.value
  }

  /**
   * empties the store
   */
  const clear = () => {
    byId.value = {}
  }

  return { byId, list, ids, getId, clear, has, hasItem, get, getItem, set, setItem, remove, removeItem, getKeys, merge }
}
