import type { Params, Query } from '../types'
import type { MaybeRef } from '@vueuse/core'
import type { UseFindParams } from './types'
import type { Ref } from 'vue-demi'
import { _ } from '@feathersjs/commons'
import { getQueryInfo } from '../utils'
import { unref } from 'vue-demi'

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
  const queryInfo = getQueryInfo(params)
  const ids = getIdsFromQueryInfo(pagination, queryInfo)
  const items = ids
    .map((id) => {
      const fromStore = service.getFromStore(id).value
      return fromStore
    })
    .filter((i) => i) // filter out undefined values
  return items
}
