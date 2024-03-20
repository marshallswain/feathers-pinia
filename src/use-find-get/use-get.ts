import type { Id } from '@feathersjs/feathers'
import type { MaybeRef } from '@vueuse/core'
import { computed, isRef, reactive, ref, unref, watch } from 'vue-demi'
import type { AnyData, MaybeRefOrComputed } from '../types.js'
import type { UseFindGetDeps, UseGetParams } from './types.js'

export function useGet<M = AnyData>(_id: MaybeRefOrComputed<Id | null>, _params: MaybeRef<UseGetParams> = ref({}), deps: UseFindGetDeps) {
  const { service } = deps

  // normalize args into refs
  const id = isRef(_id) ? _id : ref(_id)
  const params = isRef(_params) ? _params : ref(_params)

  /** ID & PARAMS */
  const { immediate = true, watch: _watch = true } = params.value
  const isSsr = computed<boolean>(() => service.store.isSsr)

  /** REQUEST STATE */
  const isPending = ref(false)
  const hasBeenRequested = ref(false)
  const error = ref<any>(null)
  const clearError = () => (error.value = null)

  /** STORE ITEMS */
  const ids = ref<Id[]>([])
  const mostRecentId = computed(() => {
    return ids.value.length && ids.value[ids.value.length - 1]
  })
  const data = computed<M | null>(() => {
    if (isPending.value && mostRecentId.value != null) {
      const result = service.store.getFromStore(mostRecentId.value, params).value
      return result
    }
    const result = service.store.getFromStore(id.value, params).value
    return result
  })
  const getFromStore = service.store.getFromStore

  const hasLoaded = computed(() => !!data.value)

  /** QUERY WHEN */
  let queryWhenFn = () => true
  const queryWhen = (_queryWhenFn: () => boolean) => {
    queryWhenFn = _queryWhenFn
  }

  /** SERVER FETCHING */
  const requestCount = ref(0)
  const request = ref<Promise<AnyData> | null>(null)
  async function get() {
    const _id = unref(id)
    const _params = unref(params)

    if (!queryWhenFn())
      return

    if (_id == null)
      return null

    requestCount.value++
    hasBeenRequested.value = true // never resets
    isPending.value = true
    error.value = null

    try {
      const response = await service.get(_id, _params)

      // Keep a list of retrieved ids
      if (response && _id)
        ids.value.push(_id)

      return response
    }
    catch (err: any) {
      error.value = err
    }
    finally {
      isPending.value = false
    }
  }

  async function makeRequest() {
    request.value = get()
    const val = await request.value
    return val
  }

  // SSR servers directly make the request
  if (isSsr.value) {
    if (immediate)
      makeRequest()
  }
  // Browsers make requests from the watcher
  else {
    if (_watch) {
      watch(
        id,
        async () => {
          await makeRequest()
        },
        { immediate, flush: 'pre' },
      )
    }
  }

  return reactive({
    params, // Ref<GetClassParams>
    isSsr, // ComputedRef<boolean>

    // Data
    data, // ComputedRef<M | null>
    ids, // Ref<Id[]>
    getFromStore, // (id: Id | null, params: Params<Query>) => M | undefined

    // Requests & Watching
    get: makeRequest, // GetFn<M>
    request, // Ref<Promise<M | undefined>>
    requestCount, // Ref<number>
    queryWhen, // (queryWhenFn: () => boolean) => void

    // Request State
    isPending: computed(() => isPending.value), // ComputedRef<boolean>
    hasBeenRequested: computed(() => hasBeenRequested.value), // ComputedRef<boolean>
    hasLoaded: computed(() => hasLoaded.value), // ComputedRef<boolean>
    error: computed(() => error.value), // ComputedRef<any>
    clearError, // () => void
  })
}
