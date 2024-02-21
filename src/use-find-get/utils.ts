import type { MaybeRef } from '@vueuse/core'
import type { Ref } from 'vue-demi'
import { _ } from '@feathersjs/commons'
import { unref } from 'vue-demi'
import type { Params, Query } from '../types.js'
import type { UseFindParams } from './types.js'

export function makeParamsWithoutPage(params: MaybeRef<UseFindParams>) {
  params = unref(params)
  const query = _.omit(params.query, '$limit', '$skip')
  const newParams = _.omit(params, 'query', 'store')
  return { ...newParams, query }
}

// Updates the _params with everything from _newParams except `$limit` and `$skip`
export function updateParamsExcludePage(_params: Ref<UseFindParams>, _newParams: MaybeRef<UseFindParams>) {
  _params.value.query = {
    ...unref(_newParams).query,
    ..._.pick(unref(_params).query, '$limit', '$skip'),
  }
}

export function getIdsFromQueryInfo(pagination: any, queryInfo: any): any[] {
  const { queryId, pageId } = queryInfo
  const queryLevel = pagination[queryId]
  const pageLevel = queryLevel && queryLevel[pageId]
  const ids = pageLevel && pageLevel.ids

  return ids || []
}

/**
 * A wrapper for findInStore that can return server-paginated data
 */
export function itemsFromPagination(store: any, service: any, params: Params<Query>) {
  const qid = params.qid || 'default'
  const pagination = store.pagination[qid] || {}
  const queryInfo = store.getQueryInfo(params)
  const ids = getIdsFromQueryInfo(pagination, queryInfo)
  const items = ids
    .map((id) => {
      const fromStore = service.getFromStore(id).value
      return fromStore
    })
    .filter(i => i) // filter out undefined values
  return items
}

export function getAllIdsFromQueryInfo(pagination: any, queryInfo: any): any[] {
  const { queryId } = queryInfo
  const queryLevel = pagination[queryId] || {}
  
  const ids = [...new Set(Object.keys(queryLevel).filter(key => !['total', 'queryParams'].includes(key)).reduce((acc, qkey) => {
    acc = acc.concat(queryLevel?.[qkey]?.ids || [])
    return acc
  }, []))]
  
  return ids || []
}

/**
 * A wrapper for findInStore that can return all server-paginated data
 */
export function allItemsFromPagination(store: any, service: any, params: Params<Query>) {
  const qid = params.qid || 'default'
  const pagination = store.pagination[qid] || {}
  const queryInfo = store.getQueryInfo(params)
  const ids = getAllIdsFromQueryInfo(pagination, queryInfo)
  const items = ids
    .map((id) => {
      const fromStore = service.getFromStore(id).value
      return fromStore
    })
    .filter(i => i) // filter out undefined values
  return items
}
