import { AnyData } from '../service-store'
import type { ModelFnTypeExtended } from '../use-base-model/types'
import { StorageMapUtils } from '../use-service/use-service-storage'
import { useAllStorageTypes } from '../use-service/use-all-storage-types'

/**
 * Upgrades the ModelFn to handle storage of clones
 * @param ModelFn
 * @returns ModelFn
 */
export const useModelClones = <M extends AnyData, F extends ModelFnTypeExtended<M>>(ModelFn: F) => {
  const _ModelFn: any = ModelFn

  // API to overwrite cloneStorage (for example, with the store clones)
  const setCloneStorage = (allStorage: ReturnType<typeof useAllStorageTypes>) => {
    const { additionalFields, itemStorage, tempStorage, cloneStorage, clone, commit, reset, clearAll } = allStorage
    const toMerge = {
      additionalFields,
      // items
      itemsById: itemStorage.byId,
      items: itemStorage.list,
      itemIds: itemStorage.ids,

      // temps
      tempsById: tempStorage.byId,
      temps: tempStorage.list,
      tempIds: tempStorage.ids,

      // clones
      clonesById: cloneStorage.byId,
      clones: cloneStorage.list,
      cloneIds: cloneStorage.ids,
      clone,
      commit,
      reset,

      clearAll,
    }

    Object.assign(ModelFn, toMerge)
  }
  Object.defineProperties(_ModelFn, {
    setCloneStorage: {
      configurable: true,
      value: setCloneStorage,
    },
  })

  // Default storage on the model, will be overwritten if passed to `useStore`
  const allStorage = useAllStorageTypes({ ModelFn })
  _ModelFn.setCloneStorage(allStorage)

  return ModelFn as F & { setCloneStorage: typeof setCloneStorage; clones: StorageMapUtils<M> }
}

// MARSHALL, I think the models shouldn't do any cloning on their own. Just stub them out and let the store do the cloning
