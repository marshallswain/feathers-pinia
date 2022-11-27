import type { MaybeRef } from '../utility-types'
import type { AnyData } from './types'

import { ref, computed, unref } from 'vue-demi'
import { useServiceLocal } from './use-service-local'
import { useServiceClones } from './use-service-clones'
import { useServiceStorage } from './use-service-storage'
import { markAsClone } from '../utils'

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

export const useService = (_options: UseLocalOptions) => {
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
  const { cloneStorage, clone, commit, reset } = useServiceClones({
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
  const { findInStore, countInStore, getFromStore, removeFromStore, addToStore, addOrUpdate, hydrateAll, clearAll } =
    useServiceLocal({
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
    addOrUpdate,
    clearAll,
    reset,
    hydrateAll,
  }

  return store
}
