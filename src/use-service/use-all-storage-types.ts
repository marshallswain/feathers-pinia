import { useServiceTemps } from './use-service-temps'
import { useServiceClones } from './use-service-clones'
import { useServiceStorage } from './use-service-storage'
import { AnyData } from './types'
import { del } from 'vue-demi'
import type { ModelFnType } from '../use-base-model'

interface UseAllStorageOptions<M extends AnyData> {
  ModelFn: ModelFnType<M>
}

export const useAllStorageTypes = <M extends AnyData>(options: UseAllStorageOptions<M>) => {
  const { ModelFn } = options

  // Make sure the provided item is a model "instance" (in quotes because it's not a class)
  const assureInstance = (item: M) => (item.__modelName ? item : ModelFn ? ModelFn(item) : item)

  // item storage
  const itemStorage = useServiceStorage<M>({
    getId: (item) => item[item.__idField],
    onRead: assureInstance,
    beforeWrite: assureInstance,
  })

  // temp item storage
  const { tempStorage, moveTempToItems } = useServiceTemps<M>({
    getId: (item) => item[item.__tempIdField],
    removeId: (item) => del(item, item.__tempIdField),
    itemStorage,
    onRead: assureInstance,
    beforeWrite: assureInstance,
  })

  // clones
  const { cloneStorage, clone, commit, reset, markAsClone } = useServiceClones<M>({
    itemStorage,
    tempStorage,
    onRead: assureInstance,
    beforeWrite: (item) => {
      markAsClone(item)
      return assureInstance(item)
    },
  })

  return {
    itemStorage,
    tempStorage,
    moveTempToItems,
    cloneStorage,
    clone,
    commit,
    reset,
  }
}
