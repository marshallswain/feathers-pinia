import type { AnyData } from '../service-store'
import { useServiceStorage, type StorageMapUtils } from './use-service-storage'
import { Id } from '@feathersjs/feathers/lib'

interface UseServiceTempsOptions<M extends AnyData> {
  getId: (item: M) => keyof M
  removeId: (item: M) => void
  itemStorage: StorageMapUtils
  onRead?: (item: M) => M
  beforeWrite?: (item: M) => M
}

export const useServiceTemps = <M extends AnyData>(options: UseServiceTempsOptions<M>) => {
  const { getId, removeId, itemStorage, onRead, beforeWrite } = options

  const tempStorage = useServiceStorage({
    getId,
    onRead,
    beforeWrite,
  })

  function moveTempToItems(data: M) {
    const id = itemStorage.getId(data)
    if (id == undefined) return
    const tempId: Id = itemStorage.getId(data)
    const existingTemp = tempStorage.getItem(tempId)
    if (existingTemp) {
      itemStorage.setItem(id, Object.assign(existingTemp, data))
      tempStorage.removeItem(tempId)

      const item = itemStorage.getItem(id)
      removeId(item as M)
    }
    removeId(data)
    return itemStorage.getItem(id)
  }

  return { tempStorage, moveTempToItems }
}
