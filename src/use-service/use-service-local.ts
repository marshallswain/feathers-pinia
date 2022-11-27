import type { Params } from '../types'
import type { StorageMapUtils } from './use-service-storage'
import type { Id } from '@feathersjs/feathers'
import { computed, ref, Ref, unref } from 'vue-demi'
import { filterQuery, sorter, select } from '@feathersjs/adapter-commons'
import sift from 'sift'
import { operations } from '../utils-custom-operators'
import { _ } from '@feathersjs/commons'
import fastCopy from 'fast-copy'
import { assignTempId, getArray, getId, getTempId } from '../utils'
import { AnyData, AnyDataOrArray } from './types'
import { MaybeArray } from '../utility-types'

interface UseServiceLocalOptions<M extends AnyData> {
  idField: Ref<string>
  tempIdField?: Ref<string>
  itemStorage: StorageMapUtils
  tempStorage?: StorageMapUtils
  whitelist?: Ref<string[]>
  paramsForServer?: Ref<string[]>
  moveTempToItems?: any
  /**
   * A callback after removing an item. Allows for loose coupling of other functionality, like clones.
   */
  afterRemove?: (item: M) => void
  /**
   * A callback after clearing the store. Allows loose coupling of other functionality, like clones.
   */
  afterClear?: () => void
}

const FILTERS = ['$sort', '$limit', '$skip', '$select']
const additionalOperators = ['$elemMatch']

export const useServiceLocal = <M extends AnyData>(options: UseServiceLocalOptions<M>) => {
  const {
    idField,
    tempIdField,
    itemStorage,
    tempStorage,
    paramsForServer = ref([]),
    whitelist = ref([]),
    moveTempToItems,
    afterRemove,
    afterClear,
  } = options

  /** @private */
  const _filterQueryOperators = computed(() => {
    return additionalOperators
      .concat(whitelist.value || [])
      .concat(['$like', '$iLike', '$ilike', '$notLike', '$notILike'])
    // .concat(service.options?.allow || service.options?.whitelist || [])
  })

  const findInStore = computed(() => (params: Params) => {
    params = { ...unref(params) } || {}

    const _paramsForServer = paramsForServer.value

    const q = _.omit(params.query || {}, ..._paramsForServer)

    const { query, filters } = filterQuery(q, {
      operators: _filterQueryOperators.value,
    })
    let values = itemStorage.list.value

    if (tempStorage && params.temps) {
      values.push(...tempStorage.list.value)
    }

    values = values.filter(sift(query, { operations }))

    const total = values.length

    if (filters.$sort) {
      values.sort(sorter(filters.$sort))
    }
    if (filters.$skip) {
      values = values.slice(filters.$skip)
    }
    if (typeof filters.$limit !== 'undefined') {
      values = values.slice(0, filters.$limit)
    }
    // if (filters.$select) {
    //   values = values.map((value) => _.pick(value, ...filters.$select.slice()))
    // }

    return {
      total,
      limit: filters.$limit || 0,
      skip: filters.$skip || 0,
      data: values,
    }
  })

  const countInStore = computed(() => (params: Params) => {
    params = { ...unref(params) }

    if (!params.query) throw new Error('params must contain a query-object')

    params.query = _.omit(params.query, ...FILTERS)
    return findInStore.value(params).total
  })

  const getFromStore = computed(() => (id: Id | null, params?: Params): M | null => {
    id = unref(id)
    params = fastCopy(unref(params) || {})

    let item = null
    const existingItem = itemStorage.getItem(id as Id) && select(params, idField.value)(itemStorage.getItem(id as Id))
    const tempItem =
      tempStorage &&
      tempIdField &&
      tempStorage.getItem(id as Id) &&
      select(params, tempIdField.value)(tempStorage.getItem(id as Id))

    if (existingItem) item = existingItem
    else if (tempItem) item = tempItem

    return item || null
  })

  /**
   * Removes item from all stores (items, temps, clones).
   * Reactivity in Vue 3 might be fast enough to just remove each item and not batch.
   * If an `afterRemove` callback was provided, it calls `afterRemove` with each item.
   * @param data
   */
  function removeFromStore(data: M | M[]) {
    const { items } = getArray(data)
    items.forEach((item: M) => {
      itemStorage.remove(item)
      tempStorage && tempStorage.remove(item)
      if (afterRemove) afterRemove(item)
    })
  }

  /**
   * An alias for addOrUpdate
   * @param data a single record or array of records.
   * @returns data added or modified in the store. If you pass an array, you get an array back.
   */
  function addToStore(data: AnyData): M
  function addToStore(data: AnyData[]): M[]
  function addToStore(data: AnyDataOrArray): MaybeArray<M> {
    return addOrUpdate(data)
  }

  function addOrUpdate(data: AnyData): M
  function addOrUpdate(data: AnyData[]): M[]
  function addOrUpdate(data: AnyDataOrArray): MaybeArray<M> {
    const _idField = idField.value
    const _tempIdField = tempStorage && tempIdField && tempIdField.value
    const { items, isArray } = getArray(data)

    const _items = items.map((item: AnyData) => {
      if (getId(item, _idField) != null && _tempIdField && getTempId(item, _tempIdField) != null) {
        return moveTempToItems(item)
      } else {
        return _addOrMergeToStore(item)
      }
    })

    return isArray ? _items : _items[0]
  }

  function clearAll() {
    itemStorage.clear()
    tempStorage && tempStorage.clear()

    if (afterClear) afterClear()
  }

  function hydrateAll() {
    addToStore(itemStorage.list)
  }

  /** @private */
  function _addOrMergeToStore(item: AnyData) {
    const _idField = idField.value
    const _tempIdField = tempIdField && tempIdField.value

    const asTemp = tempStorage && getId(item, _idField) != null
    if (_tempIdField && asTemp && !item[_tempIdField]) assignTempId(item, _tempIdField)

    const storage = asTemp ? tempStorage : itemStorage
    const stored = storage.merge(item)
    return stored
  }

  return {
    findInStore,
    countInStore,
    getFromStore,
    removeFromStore,
    addToStore,
    addOrUpdate,
    clearAll,
    hydrateAll,
  }
}
