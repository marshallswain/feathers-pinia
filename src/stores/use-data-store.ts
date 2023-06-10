import type { Query } from '@feathersjs/feathers'

import { computed, unref } from 'vue-demi'
import type { AnyData } from '../types.js'
import { MaybeRef } from '@vueuse/core'
import { useServiceLocal } from './local-queries.js'

import { useAllStorageTypes } from './all-storage-types.js'
import { useModelInstance } from '../modeling/use-model-instance'

export interface UseDataStoreOptions {
  idField: string
  ssr?: MaybeRef<boolean>
  customSiftOperators?: Record<string, any>
  setupInstance?: any
}

const makeDefaultOptions = () => ({
  skipGetIfExists: false,
})

export const useDataStore = <M extends AnyData, Q extends Query>(_options: UseDataStoreOptions) => {
  const options = Object.assign({}, makeDefaultOptions(), _options)
  const { idField, customSiftOperators } = options

  function setupInstance<N extends M>(this: any, data: N) {
    const asBaseModel = useModelInstance(data, {
      idField,
      clonesById: cloneStorage.byId,
      clone,
      commit,
      reset,
      createInStore,
      removeFromStore,
    })

    if (data.__isSetup) return asBaseModel
    else {
      const afterSetup = options.setupInstance ? options.setupInstance(asBaseModel) : asBaseModel
      Object.defineProperty(afterSetup, '__isSetup', { value: true })
      return afterSetup
    }
  }

  // storage
  const { itemStorage, tempStorage, cloneStorage, clone, commit, reset, addItemToStorage } = useAllStorageTypes<M>({
    getIdField: (val: AnyData) => val[idField],
    setupInstance,
  })

  const isSsr = computed(() => {
    const ssr = unref(options.ssr)
    return !!ssr
  })

  function clearAll() {
    itemStorage.clear()
    tempStorage.clear()
    cloneStorage.clear()
  }

  // local data filtering
  const { findInStore, findOneInStore, countInStore, getFromStore, createInStore, patchInStore, removeFromStore } =
    useServiceLocal<M, Q>({
      idField,
      itemStorage,
      tempStorage,
      cloneStorage,
      addItemToStorage,
      customSiftOperators,
    })

  const store = {
    new: setupInstance,
    idField,
    isSsr,

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

    // local queries
    findInStore,
    findOneInStore,
    countInStore,
    createInStore,
    getFromStore,
    patchInStore,
    removeFromStore,
    clearAll,
  }

  return store
}
