import type { AnyData } from '../service-store'
import { del, Ref, ref } from 'vue-demi'
import { useServiceStorage, type StorageMapUtils } from './use-service-storage'
import { getId, getTempId } from '../utils'

interface UseServiceTempsOptions<M extends AnyData> {
  idField: Ref<string>
  tempIdField: string
  itemStorage: StorageMapUtils
  onRead?: (item: M) => M
  beforeWrite?: (item: M) => M
}

export const useServiceTemps = <M extends AnyData>(options: UseServiceTempsOptions<M>) => {
  const { idField, itemStorage, onRead, beforeWrite } = options

  const tempIdField = ref(options.tempIdField)
  const tempStorage = useServiceStorage({
    getId: (item) => item[tempIdField.value],
    onRead,
    beforeWrite,
  })

  function moveTempToItems(data: M) {
    const _idField = idField.value
    const _tempIdField = tempIdField.value
    const id = getId(data, _idField)
    if (id == undefined) return
    const tempId = getTempId(data, _tempIdField)
    const existingTemp = tempStorage.get(tempId)
    if (existingTemp) {
      itemStorage.setItem(id, Object.assign(existingTemp, data))
      tempStorage.removeItem(tempId)

      const item = itemStorage.getItem(id)
      del(item, _tempIdField)
    }
    del(data, _tempIdField)
    return itemStorage.get(id)
  }

  return { tempIdField, tempStorage, moveTempToItems }
}
