import type { Paginated, Params, Query, QueryInfo } from './types'
import type {
  ServiceStoreDefault,
  FindFn,
  FindClassParamsStandalone,
  FindClassParams,
  CurrentQuery,
} from './service-store/types'
import type { MaybeRef } from './utility-types'
import { computed, ComputedRef, isReadonly, isRef, Ref, ref, unref, watch, WritableComputedRef } from 'vue-demi'
import { BaseModel } from './service-store/base-model'
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

type Store<M extends BaseModel> = ServiceStoreDefault<M>

export function useFindClass<M extends BaseModel>(params: MaybeRef<FindClassParamsStandalone<M>>) {
  return new Find(params)
}

export class Find<M extends BaseModel> {
  params: Ref<FindClassParams>
  onServer: boolean
  isSsr: ComputedRef<boolean>
  qid: WritableComputedRef<string>

  // Data
  data: ComputedRef<M[]>
  allData: ComputedRef<M[]>
  total: ComputedRef<number>
  limit: Ref<number>
  skip: Ref<number>
  findInStore: (params: Params<Query>) => Paginated<M>

  // Queries
  currentQuery: ComputedRef<CurrentQuery<M> | null>
  latestQuery: ComputedRef<QueryInfo | null>
  previousQuery: ComputedRef<QueryInfo | null>

  // Requests & Watching
  find: FindFn<M>
  request: Ref<Promise<Paginated<M>>>
  requestCount: Ref<number>
  queryWhen: (queryWhenFn: () => boolean) => void

  // Request State
  isPending: ComputedRef<boolean>
  haveBeenRequested: ComputedRef<boolean>
  haveLoaded: ComputedRef<boolean>
  error: ComputedRef<any>
  clearError: () => void

  // Pagination Utils
  pageCount: Ref<number>
  currentPage: Ref<number>
  canPrev: ComputedRef<boolean>
  canNext: ComputedRef<boolean>
  next: () => Promise<void>
  prev: () => Promise<void>
  toStart: () => Promise<void>
  toEnd: () => Promise<void>
  toPage: (page: number) => Promise<void>

  constructor(_params: MaybeRef<FindClassParamsStandalone<M>>) {
    // If the _params are a computed, store them so we can watch them later.
    let _computedParams: any
    if (isReadonly(_params)) {
      _computedParams = _params
    }

    const store = unref(_params).store as Store<M>
    // If we started without a query, assign an empty query. Assure computed params becomes writable ref.
    const params = isRef(_params) ? (isReadonly(_params) ? ref(_params.value) : _params) : ref(_params)

    // Remove the store from the provided params
    delete (params.value as any).store

    /*** PARAMS ***/
    this.params = params as Ref<FindClassParams>
    this.qid = computedAttr(params.value, 'qid')
    // Set qid to default if it was not passed in the params.
    if (!this.qid.value) this.qid.value = 'default'
    const { immediate = true, watch: _watch = false } = params.value
    const query = computedAttr(this.params, 'query')
    this.limit = computedAttr(query, '$limit')
    this.skip = computedAttr(query, '$skip')
    const paramsWithPagination = computed(() => {
      return {
        ...params.value,
        $limit: this.limit.value,
        $skip: this.skip.value,
      }
    })
    const paramsWithoutPagination = computed(() => {
      const queryShallowCopy = { ...(params.value.query || {}) }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { $limit, $skip, ...query } = queryShallowCopy
      return { ...params.value, query }
    })
    this.onServer = !!params.value.onServer
    this.isSsr = computed(() => store.isSsr)

    /*** REQUEST STATE ***/
    const isPending = ref(false)
    const haveBeenRequested = ref(false)
    const haveLoaded = ref(false)
    const error = ref(null)
    this.isPending = computed(() => isPending.value)
    this.haveBeenRequested = computed(() => haveBeenRequested.value)
    this.haveLoaded = computed(() => haveLoaded.value)
    this.error = computed(() => error.value)
    this.clearError = () => (error.value = null)

    /*** STORE ITEMS ***/
    this.data = computed(() => {
      if (isPending.value && this.latestQuery.value && this.onServer) {
        const { pageParams, queryParams } = this.latestQuery.value as any
        const params = { query: { ...pageParams, ...queryParams }, onServer: true }
        return makeUseFindItems(store, params).value
      }
      return makeUseFindItems(store, paramsWithPagination).value
    })
    this.allData = computed(() => {
      if (this.currentQuery == null) {
        return []
      }
      // Pull server results for each page of data
      const pageKeys = Object.keys(_.omit(this.currentQuery.value?.queryState, 'total', 'queryParams'))
      const pages = Object.values(_.pick(this.currentQuery.value?.queryState, ...pageKeys))
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
    this.findInStore = store.findInStore

    /*** QUERY WHEN ***/
    let queryWhen = () => true
    this.queryWhen = (queryWhenFn: () => boolean) => {
      queryWhen = queryWhenFn
    }
    // returns cached query data from the store BEFORE the request is sent.
    this.currentQuery = computed(() => {
      const qidState: any = store.pagination[this.qid.value]
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
    this.latestQuery = computed(() => {
      return queries.value[queries.value.length - 1] || null
    })
    this.previousQuery = computed(() => {
      return queries.value[queries.value.length - 2] || null
    })

    /*** PAGINATION DATA ***/
    const storeCount = computed(() => store.countInStore(paramsWithoutPagination.value))
    this.total = computed(() => {
      if (this.onServer) return (this.latestQuery.value as any)?.response.total
      else return storeCount.value
    })
    const pageData = usePageData(this.limit, this.skip, this.total)
    const { pageCount, currentPage, canPrev, canNext } = pageData
    Object.assign(this, { pageCount, currentPage, canPrev, canNext })

    /*** PAGINATION UTILS ***/
    const waitForExistingRequest = async () => {
      if (request.value) await request.value
    }
    this.toStart = () =>
      waitForExistingRequest()
        .then(() => pageData.toStart())
        .then(() => makeRequest())
    this.toEnd = () =>
      waitForExistingRequest()
        .then(() => pageData.toEnd())
        .then(() => makeRequest())
    this.toPage = (page: number) =>
      waitForExistingRequest()
        .then(() => pageData.toPage(page))
        .then(() => makeRequest())
    this.next = () =>
      waitForExistingRequest()
        .then(() => pageData.next())
        .then(() => makeRequest())
    this.prev = () =>
      waitForExistingRequest()
        .then(() => pageData.prev())
        .then(() => makeRequest())

    /*** SERVER FETCHING ***/
    this.requestCount = ref(0)
    this.request = ref(null) as any
    this.find = async (params: MaybeRef<Params<Query>> = paramsWithPagination) => {
      const _params = unref(params)
      // if queryWhen is falsey, return early with dummy data
      if (!queryWhen()) {
        return Promise.resolve({ data: [] as M[] } as Paginated<M>)
      }

      this.requestCount.value++
      haveBeenRequested.value = true // never resets
      isPending.value = true
      haveLoaded.value = false
      error.value = null

      try {
        const response = await store.find(_params)

        // Set limit and skip if missing
        if ((hasOwn(response, 'limit') && this.limit.value == null) || this.skip.value == null) {
          const res = response as Paginated<M>
          if (this.limit.value === undefined) this.limit.value = res.limit
          if (this.skip.value === undefined) this.skip.value = res.skip
        }
        // Keep the two most-recent queries
        if ((response as Paginated<M>).total) {
          const res = response as Paginated<M>
          const queryInfo = getQueryInfo(paramsWithPagination, res)
          queries.value.push(queryInfo)
          if (queries.value.length > 2) queries.value.shift()
        }
        haveLoaded.value = true

        return response
      } catch (err: any) {
        error.value = err
        throw err
      } finally {
        isPending.value = false
      }
    }

    /*** QUERY WATCHING ***/
    // Keep track if no $limit or $skip was passed so we don't fetch twice when they are set from the response
    let initWithLimitOrSkip = false
    // provide access to the request from inside the watcher
    const request = this.request
    if (this.limit.value || this.skip.value) initWithLimitOrSkip = true

    const makeRequest = async (_params?: Params<Query>) => {
      if (!this.onServer) return

      // Don't make a second request if no limit or skip were provided
      if (this.requestCount.value === 1 && !initWithLimitOrSkip && !_computedParams) {
        initWithLimitOrSkip = true
        return
      }
      request.value = this.find(_params || params)
      await request.value
    }

    if (this.onServer) {
      // When a read-only computed was provided, watch the params
      if (_computedParams) {
        let _cachedWatchedParams: FindClassParams
        // Run `find` whenever they change.
        const updateParams = (_params: FindClassParams) => {
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
      else if ((!_watch && immediate) || (immediate && (this.limit.value == null || this.limit.value == null))) {
        makeRequest()
      }
    }

    return this
  }
}
