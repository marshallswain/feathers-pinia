import { computed, watch } from 'vue-demi'
import { _ } from '@feathersjs/commons'
import debounce from 'just-debounce'

// Writes data to anywhere 
export function writeToStorage(id: string, data: any, storage: any) {
  const compressed = JSON.stringify(data)
  storage.setItem(id, compressed)
}

// Moves data from anywhere into the store
export async function hydrateStore(store: any, storage: any) {
  const data = await Promise.resolve().then(() => storage.getItem(store.$id));
  if (data) {
    const hydrationData = JSON.parse(data as string) || {}
    Object.assign(store, hydrationData)
  }
}

/**
 *
 * @param store pinia store
 * @param keys an array of keys to watch and write to anywhere.
 */
export function syncWithStorage(store: any, stateKeys: Array<string>, storage: any) {
  hydrateStore(store, storage)
  if (storage.onChange) {
    storage.onChange(() => hydrateStore(store, storage));
  }

  const debouncedWrite = debounce(writeToStorage, 500)
  const toWatch = computed(() => _.pick(store, ...stateKeys))

  watch(toWatch, (val) => debouncedWrite(store.$id, val, storage), { deep: true })
}
