import type { AnyData } from '../types'
import type { beforeWriteFn, onReadFn } from './types'
import type { StorageMapUtils } from './storage'
import { useServiceStorage } from './storage'

interface UseServiceTempsOptions<M extends AnyData> {
  getId: (item: M) => string
  itemStorage: StorageMapUtils<M>
  onRead?: onReadFn<M>
  beforeWrite?: beforeWriteFn<M>
}

export const useServiceTemps = <M extends AnyData>(options: UseServiceTempsOptions<M>) => {
  const { getId, itemStorage, onRead, beforeWrite } = options

  const tempStorage = useServiceStorage<M>({
    getId,
    onRead,
    beforeWrite,
  })

  function moveTempToItems(data: M) {
    if (tempStorage.has(data)) tempStorage.remove(data)

    return itemStorage.set(data)
  }

  return { tempStorage, moveTempToItems }
}
