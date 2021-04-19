import { debounce } from 'lodash'
import { _ } from '@feathersjs/commons'
import { computed, watch } from 'vue'
import lz from 'lz-string'

// Writes data to localStorage
export function writeToStorage(id: string, data: any, storage: any, { compress = true }) {
  const toWrite = compress ? lz.compress(JSON.stringify(data)) : JSON.stringify(data)
  storage.setItem(id, toWrite)
}

// Reads and decompresses data from localStorage
export function hydrateStore(store: any, storage: any, { compress = true }) {
  const data = storage.getItem(store.$id)
  if (data) {
    const hydrationData = JSON.parse(compress ? (lz.decompress(data) as string) : data)
    Object.keys(hydrationData).forEach((key: string) => {
      store[key] = hydrationData[key]
    })
  }
}

/**
 *
 * @param store pinia store
 * @param keys an array of keys to watch and write to localStorage.
 */
export function syncWithStorage(
  store: any,
  stateKeys: Array<string> = [],
  storage: Storage = window.localStorage,
  options: { compress: boolean } = { compress: true }
) {
  hydrateStore(store, storage, options)

  const debouncedWrite = debounce(writeToStorage, 500)
  const toWatch = computed(() => _.pick(store, ...stateKeys))

  watch(
    () => toWatch.value,
    (val) => {
      debouncedWrite(store.$id, val, storage, options)
    },
    { deep: true }
  )
}
