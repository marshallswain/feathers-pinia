import { _ } from '@feathersjs/commons'
import debounce from 'just-debounce'
import { computed, watch } from 'vue-demi'

// Writes data to localStorage
export function writeToStorage(id: string, data: any, storage: any) {
  const compressed = JSON.stringify(data)
  storage.setItem(id, compressed)
}

// Moves data from localStorage into the store
export function hydrateStore(store: any, storage: any) {
  const data = storage.getItem(store.$id)
  if (data) {
    const hydrationData = JSON.parse(data as string) || {}
    Object.assign(store, hydrationData)
  }
}

/**
 *
 * @param store pinia store
 * @param stateKeys an array of keys to watch and write to localStorage.
 * @param storage the storage to use. Defaults to window.localStorage.
 */
export function syncWithStorage(store: any, stateKeys: Array<string>, storage: Storage = window.localStorage) {
  hydrateStore(store, storage)

  const debouncedWrite = debounce(writeToStorage, 500)
  const toWatch = computed(() => _.pick(store, ...stateKeys))

  watch(toWatch, val => debouncedWrite(store.$id, val, storage), { deep: true })
}
