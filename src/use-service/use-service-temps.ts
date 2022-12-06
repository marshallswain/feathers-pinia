import type { AnyData } from '../service-store'
import type { BaseModelProps } from '../use-base-model'
import { useServiceStorage, type StorageMapUtils } from './use-service-storage'
import { Id } from '@feathersjs/feathers/lib'

interface UseServiceTempsOptions<M extends AnyData> {
  getId: (item: M) => string
  removeId: (item: M) => void
  itemStorage: StorageMapUtils<M>
  onRead?: (item: M) => M | (Partial<M> & BaseModelProps)
  beforeWrite?: (item: M) => M | (Partial<M> & BaseModelProps)
}

export const useServiceTemps = <M extends AnyData>(options: UseServiceTempsOptions<M>) => {
  const { getId, removeId, itemStorage, onRead, beforeWrite } = options

  const tempStorage = useServiceStorage<M>({
    getId,
    onRead,
    beforeWrite,
  })

  function moveTempToItems(data: M) {
    const id = itemStorage.getId(data)
    if (id == undefined) return data
    const tempId: Id = itemStorage.getId(data)
    const existingTemp = tempStorage.getItem(tempId)
    if (existingTemp) {
      itemStorage.setItem(id, Object.assign(existingTemp, data))
      tempStorage.removeItem(tempId)

      const item = itemStorage.getItem(id)
      removeId(item as M)
    }
    removeId(data)
    return itemStorage.getItem(id) as M
  }

  return { tempStorage, moveTempToItems }
}
