import type { ComputedRef, Ref, UnwrapNestedRefs, WritableComputedRef } from 'vue-demi'
import { computed, reactive, ref, unref, watch } from 'vue-demi'
import { _ } from '@feathersjs/commons'
import { useDebounceFn } from '@vueuse/core'
import stringify from 'fast-json-stable-stringify'
import { deepUnref, getExtendedQueryInfo } from '../utils/index.js'
import type { AnyData, ExtendedQueryInfo, Paginated, Params, Query } from '../types.js'
import { itemsFromPagination } from './utils.js'
import { usePageData } from './utils-pagination.js'
import type { UseFindGetDeps, UseFindOptions, UseFindParams } from './types.js'

export type UseFindReturn<M = AnyData> = UnwrapNestedRefs<{
  paramsWithPagination: ComputedRef<Params<Query>>
  isSsr: ComputedRef<boolean>
  qid: WritableComputedRef<string>

  data: ComputedRef<M[]>
  allLocalData: ComputedRef<M[]>
  total: ComputedRef<number>
  limit: Ref<number>
  skip: number

  currentQuery: ComputedRef<ExtendedQueryInfo | null>
  cachedQuery: ComputedRef<ExtendedQueryInfo | null>
  latestQuery: ComputedRef<ExtendedQueryInfo | null>
  previousQuery: ComputedRef<ExtendedQueryInfo | null>

  find: () => Promise<void>
  request: Ref<Promise<Paginated<M>> | null>
  requestCount: Ref<number>
  queryWhen: (queryWhenFn: () => boolean) => void

  isPending: ComputedRef<boolean>
  haveBeenRequested: ComputedRef<boolean>
  haveLoaded: ComputedRef<boolean>
  error: ComputedRef<any>
  clearError: () => void

  pageCount: Ref<number>
  currentPage: Ref<number>
  canPrev: ComputedRef<boolean>
  canNext: ComputedRef<boolean>
  next: () => Promise<void>
  prev: () => Promise<void>
  toStart: () => Promise<void>
  toEnd: () => Promise<void>
  toPage: (page: number) => Promise<void>
}>

export function useFind<M = AnyData>(params: ComputedRef<UseFindParams | null>, options: UseFindOptions = {}, deps: UseFindGetDeps): UseFindReturn<M> {
  const { pagination, debounce = 100, immediate = true, watch: _watch = true, paginateOn = 'client' } = options
  const { service } = deps
  const { store } = service

  /** PARAMS */
  const qid = computed(() => params.value?.qid || 'default')
  const limit = pagination?.limit || ref(params.value?.query?.$limit || store.defaultLimit)
  const skip = pagination?.skip || ref(params.value?.query?.$skip || 0)

  const paramsWithPagination = computed<Params<Query>>(() => {
    const query = deepUnref(params.value?.query || {})
    return {
      ...params.value,
      query: {
        ...query,
        $limit: limit.value,
        $skip: skip.value,
      },
    }
  })
  const paramsWithoutPagination = computed(() => {
    const queryShallowCopy = deepUnref(params.value?.query || {})
    const query = _.omit(queryShallowCopy, '$limit', '$skip')
    const newParams = { ...params.value, query }
    return newParams
  })

  /** REQUEST STATE */
  const isPending = ref(false)
  const haveBeenRequested = ref(false)
  const haveLoaded = ref(false)
  const error = ref<any>(null)
  const clearError = () => (error.value = null)

  /** Cached Params */
  const cachedParams = ref(deepUnref(params.value || {}))
  function updateCachedParams() {
    if (stringify(cachedParams.value) !== stringify(paramsWithPagination.value))
      cachedParams.value = paramsWithPagination.value
  }

  /** QUERY WHEN */
  let queryWhenFn = () => true
  const queryWhen = (_queryWhenFn: () => boolean) => {
    queryWhenFn = _queryWhenFn
  }
  // returns cached query data from the store BEFORE the request is sent.
  const cachedQuery = computed(() => {
    const qidState: any = store.pagination[qid.value]
    if (!qidState)
      return null

    const queryInfo = store.getQueryInfo(cachedParams.value)
    const extendedInfo = getExtendedQueryInfo({ queryInfo, service, store, qid })
    return extendedInfo
  })

  const currentQuery = computed(() => {
    const qidState: any = store.pagination[qid.value]
    if (!qidState)
      return null

    const queryInfo = store.getQueryInfo(paramsWithPagination.value)
    const extendedInfo = getExtendedQueryInfo({ queryInfo, service, store, qid })
    return extendedInfo
  })

  const allLocalData = computed(() => {
    const whichQuery = isPending.value ? cachedQuery.value : currentQuery.value
    if (whichQuery == null && paginateOn !== 'client')
      return []

    const allItems = service.findInStore(deepUnref(paramsWithoutPagination.value)).data
    return allItems
  })
  const itemsBeforeCurrent = computed(() => {
    const whichQuery = isPending.value ? cachedQuery.value : currentQuery.value
    if (whichQuery == null)
      return []

    const allItems = allLocalData.value
    const firstOfCurrentPage = whichQuery.items.find((i: any) => i)
    const indexInItems = allItems.findIndex((i: any) => i[store.idField] === firstOfCurrentPage[store.idField])
    // if indexInItems is higher than skip, use the skip value instead
    const adjustedIndex = Math.min(indexInItems, skip.value)
    const beforeCurrent = allItems.slice(0, adjustedIndex)
    return beforeCurrent
  })

  /** STORE ITEMS */
  const localParams = computed(() => {
    const beforeCurrent = itemsBeforeCurrent.value
    const adjustedSkip = skip.value + (beforeCurrent.length - skip.value)
    const params = {
      ...paramsWithPagination.value,
      query: {
        ...paramsWithPagination.value.query,
        $limit: limit.value,
        $skip: adjustedSkip,
      },
    }
    return params
  })

  const data = computed<M[]>(() => {
    if (paginateOn === 'server') {
      const values = itemsFromPagination(store, service, cachedParams.value)
      return values
    }
    else if (paginateOn === 'hybrid') {
      const result = service.findInStore(deepUnref(localParams)).data
      return result.filter((i: any) => i)
    }
    else {
      const result = service.findInStore(deepUnref(paramsWithPagination)).data
      return result.filter((i: any) => i)
    }
  })

  /** QUERIES */
  const queries: Ref<ExtendedQueryInfo[]> = ref([]) // query info after the response returns
  const latestQuery = computed(() => {
    return queries.value[queries.value.length - 1] || null
  })
  const previousQuery = computed(() => {
    return queries.value[queries.value.length - 2] || null
  })

  /** SERVER FETCHING */
  const requestCount = ref(0)
  const request = ref<Promise<Paginated<M>> | null>(null)

  // pulled into its own function so it can be called from `makeRequest` or `find`
  function setupPendingState() {
    // prevent setting pending state for cached ssr requests
    if (currentQuery.value?.ssr)
      return

    if (!haveBeenRequested.value)
      haveBeenRequested.value = true // never resets
    clearError()
    if (!isPending.value)
      isPending.value = true
    if (haveLoaded.value)
      haveLoaded.value = false
  }

  async function find(__params?: Params<Query>) {
    // When `paginateOn: 'server'` is enabled, the computed params will always be used, __params ignored.
    const ___params = unref(
      __params != null
        ? __params
        : paginateOn === 'client'
          ? paramsWithoutPagination.value
          : paramsWithPagination.value,
    )

    // if queryWhen is falsey, return early with dummy data
    if (!queryWhenFn())
      return Promise.resolve({ data: [] as AnyData[] } as Paginated<AnyData>)

    setupPendingState()
    requestCount.value++

    try {
      const response = await service.find(___params as any)

      // Keep the two most-recent queries
      if (response.total) {
        const queryInfo = store.getQueryInfo(paramsWithPagination.value)
        const extendedQueryInfo = getExtendedQueryInfo({ queryInfo, service, store, qid })
        if (extendedQueryInfo)
          queries.value.push(extendedQueryInfo as unknown as ExtendedQueryInfo)
        if (queries.value.length > 2)
          queries.value.shift()
      }
      haveLoaded.value = true

      return response
    }
    catch (err: any) {
      error.value = err
      throw err
    }
    finally {
      isPending.value = false
    }
  }
  const findDebounced = useDebounceFn<any>(find, debounce)

  /** Query Gatekeeping */
  const makeRequest = async (p?: Params<Query>) => {
    // If params are null, do nothing
    if (params.value === null)
      return

    // If we already have data for the currentQuery, update the cachedParams immediately
    if (currentQuery.value)
      updateCachedParams()

    // if the query passes queryWhen, setup the state before the debounce timer starts.
    if (queryWhenFn())
      setupPendingState()

    request.value = findDebounced(p)
    await request.value

    // cache the params to update the computed `data``
    updateCachedParams()
  }

  /** Pagination Data */
  const total = computed(() => {
    if (['server', 'hybrid'].includes(paginateOn)) {
      const whichQuery = currentQuery.value || cachedQuery.value
      return whichQuery?.total || 0
    }
    else {
      const count = service.countInStore(paramsWithoutPagination.value)
      return count.value
    }
  })
  const pageData = usePageData({ limit, skip, total, request })
  const { pageCount, currentPage, canPrev, canNext, toStart, toEnd, toPage, next, prev } = pageData

  /** Query Watching */
  if (['server', 'hybrid'].includes(paginateOn) && _watch) {
    watch(
      paramsWithPagination,
      () => {
        makeRequest()
      },
      { immediate: false, flush: 'sync' },
    )

    if (immediate)
      makeRequest()
  }

  if (paginateOn === 'server' && service.on) {
    // watch realtime events and re-query
    // TODO: only re-query when relevant
    service.on('created', () => {
      makeRequest()
    })
    service.on('patched', () => {
      makeRequest()
    })

    // if the current list had an item removed, re-query.
    service.on('removed', () => {
      // const id = item[service.store.idField]
      // const currentIds = data.value.map((i: any) => i[service.store.idField])
      // if (currentIds.includes(id))
      makeRequest()
    })
  }

  const toReturn = reactive({
    paramsWithPagination,
    isSsr: computed(() => {
      // hack: read total early during SSR to prevent hydration mismatch
      setTimeout(() => {
        ref(total.value)
      }, 0)
      return store.isSsr
    }), // ComputedRef<boolean>
    qid, // WritableComputedRef<string>

    // Data
    data, // ComputedRef<M[]>
    allLocalData, // ComputedRef<M[]>
    total, // ComputedRef<number>
    limit, // Ref<number>
    skip, // Ref<number>

    // Queries
    currentQuery, // ComputedRef<CurrentQuery<M> | null>
    cachedQuery, // ComputedRef<CurrentQuery<M> | null>
    latestQuery, // ComputedRef<QueryInfo | null>
    previousQuery, // ComputedRef<QueryInfo | null>

    // Requests & Watching
    find: makeRequest, // FindFn<M>
    request, // Ref<Promise<Paginated<M>>>
    requestCount, // Ref<number>
    queryWhen, // (queryWhenFn: () => boolean) => void

    // Request State
    isPending: computed(() => isPending.value), // ComputedRef<boolean>
    haveBeenRequested: computed(() => haveBeenRequested.value), // ComputedRef<boolean>
    haveLoaded: computed(() => haveLoaded.value), // ComputedRef<boolean>
    error: computed(() => error.value), // ComputedRef<any>
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
  })

  return toReturn
}
