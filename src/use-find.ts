import type { ModelInstance, UseServiceStore } from './use-base-model'
import type { Paginated, Params, Query, QueryInfo } from './types'
import type { MaybeRef } from './utility-types'
import type { AnyData, PaginationStateQuery } from './use-service'
import { computed, isReadonly, isRef, type Ref, ref, unref, watch, UnwrapNestedRefs, reactive } from 'vue-demi'
import { usePageData } from './utils-pagination'
import {
  computedAttr,
  getQueryInfo,
  hasOwn,
  makeParamsWithoutPage,
  makeUseFindItems,
  updateParamsExcludePage,
} from './utils'
import { _ } from '@feathersjs/commons'
import isEqual from 'fast-deep-equal'

interface QueryPagination {
  $limit: number
  $skip: number
}

export interface UseFindParams extends Params<Query> {
  query: Query
  onServer?: boolean
  qid?: string
  immediate?: boolean
  watch?: boolean
}
export interface UseFindParamsStandalone<
  M extends AnyData,
  D extends AnyData,
  Q extends AnyData,
  ModelFunc extends (data: ModelInstance<M>) => any,
> extends UseFindParams {
  store: UnwrapNestedRefs<UseServiceStore<M, D, Q, ModelFunc>>
}

interface MostRecentQuery {
  pageId: string
  pageParams: QueryPagination
  queriedAt: number
  query: Query
  queryId: string
  queryParams: Query
  total: number
}

export interface CurrentQuery<M extends AnyData> extends MostRecentQuery {
  qid: string
  ids: number[]
  items: M[]
  total: number
  queriedAt: number
  queryState: PaginationStateQuery
}

export const useFind = <
  M extends AnyData,
  D extends AnyData,
  Q extends AnyData,
  ModelFunc extends (data: ModelInstance<M>) => any,
>(
  _params: MaybeRef<UseFindParamsStandalone<M, D, Q, ModelFunc>>,
) => {
  // If the _params are a computed, store them so we can watch them later.
  let _computedParams: any
  if (isReadonly(_params)) {
    _computedParams = _params
  }

  const store = unref(_params).store as UnwrapNestedRefs<UseServiceStore<M, D, Q, ModelFunc>>
  // If we started without a query, assign an empty query. Assure computed params becomes writable ref.
  const params: Ref<UseFindParams> = isRef(_params)
    ? isReadonly(_params)
      ? ref(_params.value)
      : _params
    : ref(_params)

  // Remove the store from the provided params
  delete (params.value as any).store

  /*** PARAMS ***/
  const qid = computedAttr(params.value, 'qid')
  // Set qid to default if it was not passed in the params.
  if (!qid.value) qid.value = 'default'
  const { immediate = true, watch: _watch = false } = params.value
  const query = computedAttr(params, 'query')
  const limit = computedAttr(query, '$limit')
  const skip = computedAttr(query, '$skip')
  const paramsWithPagination = computed(() => {
    return {
      ...params.value,
      $limit: limit.value,
      $skip: skip.value,
    }
  })
  const paramsWithoutPagination = computed(() => {
    const queryShallowCopy = { ...(params.value.query || {}) }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { $limit, $skip, ...query } = queryShallowCopy
    return { ...params.value, query }
  })
  const onServer = !!params.value.onServer
  const isSsr = computed(() => store.isSsr)

  /*** REQUEST STATE ***/
  const _isPending = ref(false)
  const _haveBeenRequested = ref(false)
  const _haveLoaded = ref(false)
  const _error = ref<any>(null)

  const isPending = computed(() => _isPending.value)
  const haveBeenRequested = computed(() => _haveBeenRequested.value)
  const haveLoaded = computed(() => _haveLoaded.value)
  const error = computed(() => _error.value)
  const clearError = () => (_error.value = null)

  /*** STORE ITEMS ***/
  const data = computed(() => {
    if (isPending.value && latestQuery.value && onServer) {
      const { pageParams, queryParams } = latestQuery.value as any
      const params = { query: { ...pageParams, ...queryParams }, onServer: true }
      return makeUseFindItems(store, params).value
    }
    return makeUseFindItems(store, paramsWithPagination).value
  })
  const allData = computed(() => {
    if (currentQuery.value == null) {
      return []
    }
    // Pull server results for each page of data
    const pageKeys = Object.keys(_.omit(currentQuery.value?.queryState, 'total', 'queryParams'))
    const pages = Object.values(_.pick(currentQuery.value?.queryState, ...pageKeys))
    // remove possible duplicates (page data can be different as you browse between pages and new items are added)
    const ids = pages.reduce((allIds, page) => {
      page.ids.forEach((id: number | string) => {
        if (!allIds.includes(id)) allIds.push(id)
      })
      return allIds
    }, [])
    const matchingItemsById = _.pick(store.itemsById, ...ids)
    return Object.values(matchingItemsById)
  })
  const findInStore = store.findInStore

  /*** QUERY WHEN ***/
  let queryWhenFn = () => true
  const queryWhen = (_queryWhenFn: () => boolean) => {
    queryWhenFn = _queryWhenFn
  }
  // returns cached query data from the store BEFORE the request is sent.
  const currentQuery = computed(() => {
    const qidState: any = store.pagination[qid.value]
    if (!qidState) return null
    const queryInfo = getQueryInfo(params.value)
    delete queryInfo.response
    delete queryInfo.isOutdated

    const queryState = qidState[queryInfo.queryId]
    if (!queryState) return null

    const { total } = queryState
    const pageState = queryState[queryInfo.pageId as string]
    if (!pageState) return null

    const { ids, queriedAt } = pageState
    const items = Object.values(_.pick(store.itemsById, ...ids))
    const info = { ...queryInfo, ids, items, total, queriedAt, queryState } as CurrentQuery<M>
    return info || null
  })

  /*** QUERIES ***/
  const queries: Ref<QueryInfo[]> = ref([]) // query info after the response returns
  const latestQuery = computed(() => {
    return queries.value[queries.value.length - 1] || null
  })
  const previousQuery = computed(() => {
    return queries.value[queries.value.length - 2] || null
  })

  /*** PAGINATION DATA ***/
  const storeCount = computed(() => store.countInStore(paramsWithoutPagination.value as any))
  const total = computed(() => {
    if (onServer) return (latestQuery.value as any)?.response.total
    else return storeCount.value
  })
  const pageData = usePageData(limit, skip, total)
  const { pageCount, currentPage, canPrev, canNext } = pageData

  /*** PAGINATION UTILS ***/
  const waitForExistingRequest = async () => {
    if (request.value) await request.value
  }
  const toStart = () =>
    waitForExistingRequest()
      .then(() => pageData.toStart())
      .then(() => makeRequest())
  const toEnd = () =>
    waitForExistingRequest()
      .then(() => pageData.toEnd())
      .then(() => makeRequest())
  const toPage = (page: number) =>
    waitForExistingRequest()
      .then(() => pageData.toPage(page))
      .then(() => makeRequest())
  const next = () =>
    waitForExistingRequest()
      .then(() => pageData.next())
      .then(() => makeRequest())
  const prev = () =>
    waitForExistingRequest()
      .then(() => pageData.prev())
      .then(() => makeRequest())

  /*** SERVER FETCHING ***/
  const requestCount = ref(0)
  const request = ref<Promise<Paginated<M>> | null>(null)
  const find = async (params = paramsWithPagination.value) => {
    const _params = unref(params)
    // if queryWhen is falsey, return early with dummy data
    if (!queryWhenFn()) {
      return Promise.resolve({ data: [] as M[] } as Paginated<M>)
    }

    requestCount.value++
    _haveBeenRequested.value = true // never resets
    _isPending.value = true
    _haveLoaded.value = false
    _error.value = null

    try {
      const response = await store.find(_params as any)

      // Set limit and skip if missing
      if ((hasOwn(response, 'limit') && limit.value == null) || skip.value == null) {
        const res = response
        if (limit.value === undefined) limit.value = res.limit
        if (skip.value === undefined) skip.value = res.skip
      }
      // Keep the two most-recent queries
      if (response.total) {
        const res = response
        const queryInfo = getQueryInfo(paramsWithPagination, res)
        queries.value.push(queryInfo)
        if (queries.value.length > 2) queries.value.shift()
      }
      _haveLoaded.value = true

      return response
    } catch (err: any) {
      _error.value = err
      throw err
    } finally {
      _isPending.value = false
    }
  }

  /*** QUERY WATCHING ***/
  // Keep track if no $limit or $skip was passed so we don't fetch twice when they are set from the response
  let initWithLimitOrSkip = false
  // provide access to the request from inside the watcher
  if (limit.value || skip.value) initWithLimitOrSkip = true

  const makeRequest = async (_params?: Params<Query>) => {
    if (!onServer) return

    // Don't make a second request if no limit or skip were provided
    if (requestCount.value === 1 && !initWithLimitOrSkip && !_computedParams) {
      initWithLimitOrSkip = true
      return
    }
    request.value = find((_params || params) as any) as any
    await request.value
  }

  if (onServer) {
    // When a read-only computed was provided, watch the params
    if (_computedParams) {
      let _cachedWatchedParams: UseFindParams
      // Run `find` whenever they change.
      const updateParams = (_params: UseFindParams) => {
        // If params are null, do nothing
        if (_params == null) return

        // If params don't match the cached ones, update internal params and send request.
        const newParams = makeParamsWithoutPage(_params)
        if (!isEqual(_.omit(newParams, 'store'), _.omit(_cachedWatchedParams, 'store'))) {
          _cachedWatchedParams = newParams
          updateParamsExcludePage(params as any, newParams)
          makeRequest()
        }
      }
      watch(_computedParams, updateParams, { immediate })
    }
    // Watch the reactive params
    else if (_watch && !_computedParams) {
      watch(paramsWithoutPagination, () => makeRequest(), { immediate })
    }
    // If immediate is provided without limit or skip, manually run immediately
    else if ((!_watch && immediate) || (immediate && (limit.value == null || limit.value == null))) {
      makeRequest()
    }
  }

  return {
    params, // Ref<FindClassParams>
    onServer, // boolean
    isSsr, // ComputedRef<boolean>
    qid, // WritableComputedRef<string>

    // Data
    data, // ComputedRef<M[]>
    allData, // ComputedRef<M[]>
    total, // ComputedRef<number>
    limit, // Ref<number>
    skip, // Ref<number>
    findInStore, // (params: Params<Query>) => Paginated<M>

    // Queries
    currentQuery, // ComputedRef<CurrentQuery<M> | null>
    latestQuery, // ComputedRef<QueryInfo | null>
    previousQuery, // ComputedRef<QueryInfo | null>

    // Requests & Watching
    find, // FindFn<M>
    request, // Ref<Promise<Paginated<M>>>
    requestCount, // Ref<number>
    queryWhen, // (queryWhenFn: () => boolean) => void

    // Request State
    isPending, // ComputedRef<boolean>
    haveBeenRequested, // ComputedRef<boolean>
    haveLoaded, // ComputedRef<boolean>
    error, // ComputedRef<any>
    clearError, // () => void

    // Pagination Utils
    pageCount, // Ref<number>
    currentPage, // Ref<number>
    canPrev, // ComputedRef<boolean>
    canNext, // ComputedRef<boolean>
    next, // () => Promise<void>
    prev, // () => Promise<void>
    toStart, // () => Promise<void>
    toEnd, // () => Promise<void>
    toPage, // (page: number) => Promise<void>
  }
}
