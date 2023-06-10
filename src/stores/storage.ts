import type { Id } from '@feathersjs/feathers'
import type { ById, AnyData } from '../types.js'
import type { AssignFn, beforeWriteFn, onReadFn } from './types.js'
import { computed, reactive, del as vueDel, set as vueSet } from 'vue-demi'

interface UseServiceStorageOptions<M extends AnyData> {
  getId: (item: M) => string
  onRead?: onReadFn<M>
  beforeWrite?: beforeWriteFn<M>
  assign?: AssignFn<M>
}

export type StorageMapUtils<M extends AnyData> = ReturnType<typeof useServiceStorage<M>>

/**
 * General storage adapter
 */
export const useServiceStorage = <M extends AnyData>({
  getId,
  onRead = (item) => item,
  beforeWrite = (item) => item,
  assign = (dest, src) => Object.assign(dest, src),
}: UseServiceStorageOptions<M>) => {
  const byId: ById<M> = reactive({})

  const list = computed(() => {
    return Object.values(byId)
  })

  const ids = computed(() => {
    return Object.keys(byId)
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
    return !!byId[id]
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
    if (existing) assign(existing, item)
    else setItem(id, item)

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
    const inStore = byId[id]
    const _item = inStore ? onRead(inStore) : null
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
    vueSet(byId, id, beforeWrite(item))
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
    if (hadItem) vueDel(byId, id)

    return hadItem
  }

  const getKeys = () => {
    return ids.value
  }

  /**
   * empties the store
   */
  const clear = () => {
    Object.keys(byId).forEach((id) => {
      vueDel(byId, id)
    })
  }

  return { byId, list, ids, getId, clear, has, hasItem, get, getItem, set, setItem, remove, removeItem, getKeys, merge }
}
