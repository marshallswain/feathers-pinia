import type { MaybeRef } from '../utility-types'
import type { AnyData } from './types'

import { ref, computed, unref } from 'vue-demi'
import { useServiceLocal } from './use-service-local-queries'
import { useServiceClones } from './use-service-clones'
import { useServiceStorage } from './use-service-storage'

export type UseLocalOptions = {
  Model?: any
  idField?: string
  whitelist?: string[]
  ssr?: MaybeRef<boolean>
}

const makeDefaultOptions = () => ({
  idField: 'id',
  tempIdField: '__tempId',
  skipRequestIfExists: false,
})

/**
 * Creates a store for working with local data, only.
 * @param options
 * @returns
 */
export const useLocal = (_options: UseLocalOptions) => {
  const options = Object.assign({}, makeDefaultOptions(), _options)
  const ModelFn = options.Model
  const whitelist = ref(options.whitelist ?? [])

  // Make sure the provided item is a model "instance" (in quotes because it's not a class)
  const assureInstance = (item: AnyData) => (item.__modelName ? item : ModelFn(item))

  // item storage
  const idField = ref(options.idField)
  const itemStorage = useServiceStorage({
    getId: (item) => item[idField.value],
    onRead: assureInstance,
    beforeWrite: assureInstance,
  })

  // clones
  const { cloneStorage, clone, commit, reset, markAsClone } = useServiceClones({
    itemStorage,
    onRead: assureInstance,
    beforeWrite: (item) => {
      markAsClone(item)
      return assureInstance(item)
    },
  })

  const isSsr = computed(() => {
    const ssr = unref(options.ssr)
    return !!ssr
  })

  // local data filtering
  const { findInStore, countInStore, getFromStore, removeFromStore, addToStore, clearAll } = useServiceLocal({
    idField,
    itemStorage,
    whitelist,
    afterRemove: (item: any) => {
      cloneStorage.remove(item)
    },
    afterClear: () => {
      cloneStorage.clear()
    },
  })

  const store = {
    // service
    Model: computed(() => ModelFn),

    // items
    idField,
    itemsById: itemStorage.byId,
    items: itemStorage.list,
    itemIds: itemStorage.ids,

    // clones
    clonesById: cloneStorage.byId,
    clones: cloneStorage.list,
    cloneIds: cloneStorage.ids,
    clone,
    commit,

    // options
    whitelist,
    isSsr,

    // getter functions
    findInStore,
    countInStore,
    getFromStore,

    // store handlers
    removeFromStore,
    addToStore,
    clearAll,
    reset,
  }

  return store
}
