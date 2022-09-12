import type { UseFindComputed, UseFindOptionsStandalone, UseFindState } from './service-store/types'
import type { Params, Paginated } from './types'
import { computed, reactive, Ref, unref, toRefs, watch } from 'vue-demi'
import debounce from 'just-debounce'
import { getQueryInfo, makeUseFind } from './utils'
import { BaseModel } from './service-store'

export function useFind<M extends BaseModel = BaseModel>({
  model,
  params = computed(() => null),
  fetchParams = computed(() => undefined),
  qid = 'default',
  queryWhen = computed(() => true),
  local = false,
  immediate = true,
}: UseFindOptionsStandalone<M>) {
  if (!model) {
    throw new Error(`No model provided for useFind(). Did you define and register it with FeathersPinia?`)
  }

  const getParamsForFetch = (providedParams?: Params | Ref<Params>): Params | null => {
    const provided = unref(providedParams)
    const forFetch = unref(fetchParams)

    const paramsToUse =
      provided || provided === null ? provided : forFetch || forFetch === null ? forFetch : unref(params)

    return paramsToUse
  }

  const state = reactive<UseFindState>({
    qid,
    isPending: false,
    haveBeenRequested: false,
    haveLoaded: local,
    error: null,
    debounceTime: null,
    latestQuery: null,
    isLocal: local,
    request: null,
  })

  const computes: UseFindComputed<M> = {
    // The find getter
    items: makeUseFind(model.store || model, params).items,
    paginationData: computed(() => {
      return model.store.pagination
    }),
    servicePath: computed(() => model.servicePath),
    isSsr: computed(() => model.store.isSsr),
  }

  /**
   * If queryWhen is a function, call queryWhen with a context, otherwise return its value.
   * @param queryWhen
   * @param params
   * @returns boolean
   */
  function handleQueryWhen(queryWhen: any, params: Params | Ref<Params>): boolean {
    const val = unref(queryWhen)
    // If queryWhen returns a function, call it with a context
    if (typeof val === 'function') {
      const info = getQueryInfo(params, {})
      const qidData = model.store.pagination[info.qid]
      // @ts-expect-error fix me ts(7053)
      const queryData = qidData?.[info.queryId]
      const pageData = queryData?.[info.pageId as string]
      const context = {
        items: computes.items,
        queryInfo: info,
        qidData,
        queryData,
        pageData,
        isPending: computed(() => state.isPending),
        haveBeenRequested: computed(() => state.haveBeenRequested),
        haveLoaded: computed(() => state.haveLoaded),
        error: computed(() => state.error),
      }
      return val(context)
    }
    return val
  }

  /**
   * Fetch records from the API server.
   * @param params
   * @returns query results
   */
  function find(params: Params | Ref<Params>): Promise<M[] | Paginated<M>> | void {
    if (state.isLocal) return

    params = unref(params)
    state.isPending = true
    state.haveBeenRequested = true

    const request = model.find(params).then((response: any) => {
      // To prevent thrashing, only clear error on response, not on initial request.
      state.error = null
      state.haveLoaded = true
      if (!Array.isArray(response)) {
        const queryInfo = getQueryInfo(params, response)
        queryInfo.isOutdated = false
        state.latestQuery = queryInfo
      }
      state.isPending = false
      return response
    })
    state.request = request
    return request
  }
  const methods = {
    findDebounced(params: Params) {
      return find(params)
    },
  }
  function findProxy(params?: Params | Ref<Params>) {
    const paramsToUse = getParamsForFetch(params)

    if (paramsToUse && paramsToUse.debounce) {
      if (paramsToUse.debounce !== state.debounceTime) {
        methods.findDebounced = debounce(find, paramsToUse.debounce)
        state.debounceTime = paramsToUse.debounce
      }
      return methods.findDebounced(paramsToUse)
    } else if (paramsToUse) {
      return find(paramsToUse)
    } else {
      // Set error
    }
  }

  const wrappedQueryWhen = computed(() => {
    const params = getParamsForFetch()
    if (typeof queryWhen.value === 'function') {
      return handleQueryWhen(queryWhen.value, params as Params)
    } else {
      return queryWhen.value
    }
  })

  watch(
    () => [getParamsForFetch(), wrappedQueryWhen.value],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ([params, queryWhen]: (boolean | Params | null)[]) => {
      if (queryWhen) {
        findProxy()
      }
    },
    { immediate },
  )

  return { ...computes, ...toRefs(state), find: findProxy }
}
