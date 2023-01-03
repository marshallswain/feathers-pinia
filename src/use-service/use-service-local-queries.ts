import type { Params } from '../types'
import type { StorageMapUtils } from './use-service-storage'
import type { Id } from '@feathersjs/feathers'
import { computed, ref, Ref, unref } from 'vue-demi'
import { filterQuery, sorter, select } from '@feathersjs/adapter-commons'
import sift from 'sift'
import { operations } from '../utils-custom-operators'
import { _ } from '@feathersjs/commons'
import fastCopy from 'fast-copy'
import { AnyData } from './types'

interface UseServiceLocalOptions<M extends AnyData> {
  idField: Ref<string>
  itemStorage: StorageMapUtils<M>
  tempStorage?: StorageMapUtils<M>
  whitelist?: Ref<string[]>
  paramsForServer?: Ref<string[]>
}

const FILTERS = ['$sort', '$limit', '$skip', '$select']
const additionalOperators = ['$elemMatch']

export const useServiceLocal = <M extends AnyData, Q extends AnyData>(options: UseServiceLocalOptions<M>) => {
  const { idField, itemStorage, tempStorage, paramsForServer = ref([]), whitelist = ref([]) } = options

  /** @private */
  const _filterQueryOperators = computed(() => {
    return additionalOperators
      .concat(whitelist.value || [])
      .concat(['$regex', '$options'])
      .concat(['$like', '$iLike', '$ilike', '$notLike', '$notILike'])
    // .concat(service.options?.allow || service.options?.whitelist || [])
  })

  const findInStore = computed(() => (params: Params<Q>) => {
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
      data: params.clones ? values.map(v => v.clone ? v.clone(undefined, { useExisting: true }) : v) : values,
    }
  })

  const countInStore = computed(() => (params: Params<Q>) => {
    params = { ...unref(params) }

    if (!params.query) throw new Error('params must contain a query-object')

    params.query = _.omit(params.query, ...FILTERS)
    return findInStore.value(params).total
  })

  const getFromStore = computed(() => (id: Id | null, params?: Params<Q>): M | null => {
    id = unref(id)
    params = fastCopy(unref(params) || {})

    let item = null
    const existingItem = itemStorage.getItem(id as Id) && select(params, idField.value)(itemStorage.getItem(id as Id))
    const tempItem =
      tempStorage && tempStorage.getItem(id as Id) && select(params, '__tempId')(tempStorage.getItem(id as Id))

    if (existingItem) item = existingItem
    else if (tempItem) item = tempItem

    return params.clones && item.clone ? item.clone(undefined, { useExisting: true }) : item || null
  })

  const associations = {}

  return {
    findInStore,
    countInStore,
    getFromStore,
    associations,
  }
}
