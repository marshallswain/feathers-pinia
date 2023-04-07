import type { Id } from '@feathersjs/feathers'
import { _ } from '@feathersjs/commons'
import { computed, unref } from 'vue-demi'
import { filterQuery, select, sorter } from '@feathersjs/adapter-commons'
import sift from 'sift'
import fastCopy from 'fast-copy'
import type { AnyData, Params } from '../types'
import { deepUnref, getArray } from '../utils'
import { sqlOperations } from './utils-custom-operators'
import type { StorageMapUtils } from './storage'

interface UseServiceLocalOptions<M extends AnyData> {
  idField: string
  itemStorage: StorageMapUtils<M>
  tempStorage?: StorageMapUtils<M>
  cloneStorage?: StorageMapUtils<M>
  addItemToStorage: any
  whitelist?: string[]
  paramsForServer?: string[]
  customSiftOperators?: Record<string, any>
}

const FILTERS = ['$sort', '$limit', '$skip', '$select']
const additionalOperators = [
  '$in',
  '$nin',
  '$exists',
  'eq',
  'ne',
  '$mod',
  '$all',
  '$not',
  '$size',
  '$type',
  '$regex',
  '$options',
  '$where',
  '$elemMatch',
]

export function useServiceLocal<M extends AnyData, Q extends AnyData>(options: UseServiceLocalOptions<M>) {
  const {
    idField,
    itemStorage,
    tempStorage,
    cloneStorage,
    addItemToStorage,
    paramsForServer = [],
    whitelist = [],
    customSiftOperators = {},
  } = options

  const operations = Object.assign({}, sqlOperations, customSiftOperators)

  /** @private */
  const _filterQueryOperators = computed(() => {
    return additionalOperators.concat(whitelist || []).concat(Object.keys(operations))
  })

  const filterItems = (params: Params<Q>, startingValues: M[] = []) => {
    params = { ...unref(params) } || {}
    const _paramsForServer = paramsForServer
    const q = _.omit(params.query || {}, ..._paramsForServer)

    const { query, filters } = filterQuery(q, {
      operators: _filterQueryOperators.value,
    })
    let values = startingValues.concat(itemStorage.list.value)

    if (tempStorage && params.temps) values.push(...tempStorage.list.value)

    if (filters.$or) query.$or = filters.$or

    if (filters.$and) query.$and = filters.$and

    values = values.filter(sift(query, { operations }))
    return { values, filters }
  }

  function findInStore(params: Params<Q>) {
    const result = computed(() => {
      // clean up any nested refs
      if (params.query) params.query = deepUnref(params.query)

      const filtered = filterItems(params)
      const filters = filtered.filters
      let values = filtered.values

      const total = values.length

      if (filters.$sort) values.sort(sorter(filters.$sort))

      if (filters.$skip) values = values.slice(filters.$skip)

      if (typeof filters.$limit !== 'undefined') values = values.slice(0, filters.$limit)

      return {
        total,
        limit: filters.$limit || 0,
        skip: filters.$skip || 0,
        data: params.clones
          ? values.map((v: any) => (v.clone ? v.clone(undefined, { useExisting: true }) : v))
          : values,
      }
    })
    return {
      total: computed(() => result.value.total),
      limit: computed(() => result.value.limit),
      skip: computed(() => result.value.skip),
      data: computed(() => result.value.data),
    }
  }

  function findOneInStore(params: Params<Q>) {
    const result = findInStore(params)
    const item = computed(() => {
      return result.data.value[0] || null
    })
    return item
  }

  function countInStore(params: Params<Q>) {
    const value = computed(() => {
      params = { ...unref(params) }

      if (!params.query) throw new Error('params must contain a query object')

      params.query = _.omit(params.query, ...FILTERS)
      return findInStore(params).total.value
    })
    return value
  }

  const getFromStore = (id: Id | null, params?: Params<Q>) => {
    return computed((): M | null => {
      id = unref(id)
      params = fastCopy(unref(params) || {})
      if (params.query) params.query = deepUnref(params.query)

      let item = null
      const existingItem = itemStorage.getItem(id as Id) && select(params, idField)(itemStorage.getItem(id as Id))
      const tempItem =
        tempStorage && tempStorage.getItem(id as Id) && select(params, '__tempId')(tempStorage.getItem(id as Id))

      if (existingItem) item = existingItem
      else if (tempItem) item = tempItem

      const toReturn = params.clones && item.clone ? item.clone(undefined, { useExisting: true }) : item || null
      return toReturn
    })
  }

  /**
   * Write records to the store.
   * @param data a single record or array of records.
   * @returns data added or modified in the store. If you pass an array, you get an array back.
   */
  function createInStore(data: M | M[]): M | M[] {
    const { items, isArray } = getArray(data)

    const _items = items.map((item: AnyData) => {
      const stored = addItemToStorage(item as any)
      return stored
    })

    return isArray ? _items : _items[0]
  }

  // TODO
  function patchInStore() {
    return
  }

  /**
   * If a clone is provided, it removes the clone from the store.
   * If a temp is provided, it removes the temp from the store.
   * If an item is provided, the item and its associated temp and clone are removed.
   * If a string is provided, it removes any item, temp, or clone from the stores.
   * @param data
   */
  function removeFromStore(data: M | M[] | null, params?: Params<Q>) {
    if (data === null && params?.query && Object.keys(params?.query).length) {
      const clones = cloneStorage ? cloneStorage.list.value : []
      const { values } = filterItems(params, clones)
      const result = removeItems(values)
      return result
    } else if (data !== null) {
      removeItems(data)
    }

    return data
  }

  function removeItems(data: M | M[]) {
    const { items } = getArray(data)
    items.forEach((item: M) => {
      if (typeof item === 'string') {
        itemStorage.removeItem(item)
        tempStorage?.removeItem(item)
        cloneStorage?.removeItem(item)
      } else {
        if ((item as M).__isClone) return cloneStorage?.remove(item as M)

        if ((item as M).__isTemp) return tempStorage?.remove(item as M)

        itemStorage.remove(item)
        tempStorage?.remove(item)
        cloneStorage?.remove(item)
      }
    })
    return data
  }

  return {
    findInStore,
    findOneInStore,
    countInStore,
    getFromStore,
    createInStore,
    patchInStore,
    removeFromStore,
  }
}
