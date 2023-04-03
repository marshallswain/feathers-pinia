import type { Id } from '@feathersjs/feathers'
import type { Params } from '../types'
import type { AnyData } from '../types'
import type { StorageMapUtils } from './storage'
import { _ } from '@feathersjs/commons'
import { computed, unref } from 'vue-demi'
import { filterQuery, select, sorter } from '@feathersjs/adapter-commons'
import { sqlOperations } from './utils-custom-operators'
import sift from 'sift'
import fastCopy from 'fast-copy'
import { deepUnref } from '../utils'

interface UseServiceLocalOptions<M extends AnyData> {
  idField: string
  itemStorage: StorageMapUtils<M>
  tempStorage?: StorageMapUtils<M>
  cloneStorage?: StorageMapUtils<M>
  removeFromStore: (data: M | M[]) => M | M[]
  whitelist?: string[]
  paramsForServer?: string[]
  customSiftOperators?: Record<string, any>
}

const FILTERS = ['$sort', '$limit', '$skip', '$select']
const additionalOperators = ['$elemMatch']

export const useServiceLocal = <M extends AnyData, Q extends AnyData>(options: UseServiceLocalOptions<M>) => {
  const {
    idField,
    itemStorage,
    tempStorage,
    cloneStorage,
    removeFromStore,
    paramsForServer = [],
    whitelist = [],
    customSiftOperators = {},
  } = options

  const operations = Object.assign({}, sqlOperations, customSiftOperators)

  /** @private */
  const _filterQueryOperators = computed(() => {
    return additionalOperators
      .concat(whitelist || [])
      .concat(['$regex', '$options'])
      .concat(Object.keys(operations))
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

  const findInStore = (params: Params<Q>) => {
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

  const countInStore = (params: Params<Q>) => {
    const value = computed(() => {
      params = { ...unref(params) }

      if (!params.query) throw new Error('params must contain a query object')

      params.query = _.omit(params.query, ...FILTERS)
      return findInStore(params).total.value
    })
    return value
  }

  const getFromStore = (id: Id | null, params?: Params<Q>) =>
    computed((): M | null => {
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

  const removeByQuery = (params: Params<Q>) => {
    const clones = cloneStorage ? cloneStorage.list.value : []
    const { values } = filterItems(params, clones)
    const result = removeFromStore(values)
    return result
  }

  const associations = {}

  return {
    findInStore,
    countInStore,
    getFromStore,
    associations,
    removeByQuery,
  }
}
