import type { Params } from '@feathersjs/feathers'
import type { ComputedRef, Ref } from 'vue-demi'
import type { PaginationState, UpdatePaginationForQueryOptions } from './types'
import { ref, set } from 'vue-demi'
import { getId, getQueryInfo, hasOwn } from '../utils'

export interface UseServicePagination {
  idField: string
  isSsr: ComputedRef<boolean>
}

export const useServicePagination = (options: UseServicePagination) => {
  const { idField, isSsr } = options

  const pagination = ref({}) as Ref<PaginationState>

  function clearPagination() {
    const { defaultLimit, defaultSkip } = pagination.value
    pagination.value = { defaultLimit, defaultSkip } as any
  }

  /**
   * Stores pagination data on state.pagination based on the query identifier
   * (qid) The qid must be manually assigned to `params.qid`
   */
  function updatePaginationForQuery({
    qid,
    response,
    query = {},
    preserveSsr = false,
  }: UpdatePaginationForQueryOptions) {
    const { data, total } = response
    const ids = data.map((i: any) => getId(i, idField))
    const queriedAt = new Date().getTime()
    const { queryId, queryParams, pageId, pageParams } = getQueryInfo({ qid, query })

    if (!pagination.value[qid]) set(pagination.value, qid, {})

    if (!hasOwn(query, '$limit') && hasOwn(response, 'limit')) set(pagination.value, 'defaultLimit', response.limit)

    if (!hasOwn(query, '$skip') && hasOwn(response, 'skip')) set(pagination.value, 'defaultSkip', response.skip)

    const mostRecent = {
      query,
      queryId,
      queryParams,
      pageId,
      pageParams,
      queriedAt,
      total,
    }

    const existingPageData = pagination.value[qid]?.[queryId]?.[pageId as string]

    const qidData = pagination.value[qid] || {}
    Object.assign(qidData, { mostRecent })

    set(qidData, queryId, qidData[queryId] || {})
    const queryData = {
      total,
      queryParams,
    }

    set(qidData, queryId, Object.assign({}, qidData[queryId], queryData))

    const ssr = preserveSsr ? existingPageData?.ssr : isSsr.value

    const pageData = {
      [pageId as string]: { pageParams, ids, queriedAt, ssr: !!ssr },
    }

    Object.assign(qidData[queryId], pageData)

    const newState = Object.assign({}, pagination.value[qid], qidData)

    set(pagination.value, qid, newState)
  }

  function unflagSsr(params: Params) {
    const queryInfo = getQueryInfo(params)
    const { qid, queryId, pageId } = queryInfo

    const pageData = pagination.value[qid]?.[queryId]?.[pageId as string]
    pageData.ssr = false
  }

  return {
    pagination,
    updatePaginationForQuery,
    unflagSsr,
    clearPagination,
  }
}
