import type { ModelInstance, UseServiceStore } from './use-base-model'
import type { Params } from './types'
import type { MaybeRef } from './utility-types'
import type { Id, Query } from '@feathersjs/feathers'
import type { AnyData } from './use-service'
import { computed, isReadonly, isRef, Ref, ref, unref, type UnwrapNestedRefs, watch } from 'vue-demi'

export interface UseGetParams extends Params<Query> {
  query?: Query
  onServer?: boolean
  immediate?: boolean
  watch?: boolean
}

export interface UseGetParamsStandalone
  // <
  // M extends AnyData,
  // D extends AnyData,
  // Q extends AnyData,
  // ModelFunc extends (data: ModelInstance<M>) => any,
  // >
  extends UseGetParams {
  store: any
  // store: UseServiceStore<M, D, Q, ModelFunc>
}

export const useGet = <
  M extends AnyData,
  D extends AnyData,
  Q extends AnyData,
  ModelFunc extends (data: ModelInstance<M>) => any,
>(
  _id: MaybeRef<Id | null>,
  _params: MaybeRef<UseGetParamsStandalone>,
) => {
  const store = unref(_params).store as unknown as UnwrapNestedRefs<UseServiceStore<M, D, Q, ModelFunc>>
  const id = (isRef(_id) ? (isReadonly(_id) ? ref(_id.value) : _id) : ref(_id)) as Ref<Id>
  const params = isRef(_params) ? (isReadonly(_params) ? ref(_params.value) : _params) : ref(_params)

  // Remove the store from the provided params
  delete (params.value as any).store

  /*** ID & PARAMS ***/
  const { immediate = true, watch: _watch = true, onServer = false } = params.value as any
  const isSsr = computed(() => store.isSsr)

  /*** REQUEST STATE ***/
  const _isPending = ref(false)
  const _hasBeenRequested = ref(false)
  const _hasLoaded = ref(false)
  const _error = ref<any>(null)
  const isPending = computed(() => _isPending.value)
  const hasBeenRequested = computed(() => _hasBeenRequested.value)
  const hasLoaded = computed(() => _hasLoaded.value)
  const error = computed(() => _error.value)
  const clearError = () => (_error.value = null)

  /*** STORE ITEMS ***/
  const ids = ref<Id[]>([])
  const mostRecentId = computed(() => {
    return ids.value.length && ids.value[ids.value.length - 1]
  })
  const data = computed(() => {
    if (isPending.value && mostRecentId.value != null) {
      return store.getFromStore(mostRecentId.value, params as any) || null
    }
    return store.getFromStore(id.value, params as any) || null
  })
  const getFromStore = store.getFromStore

  /*** QUERY WHEN ***/
  let queryWhenFn = () => true
  const queryWhen = (_queryWhenFn: () => boolean) => {
    queryWhenFn = _queryWhenFn
  }

  /*** SERVER FETCHING ***/
  const requestCount = ref(0)
  const request = ref(null) as any
  const get = async (__id?: MaybeRef<Id>, params?: MaybeRef<Params<Query>>) => {
    const _id = unref(__id || id)
    const _params = unref(params)

    if (!queryWhenFn()) return

    if (_id == null) {
      throw new Error('id is required for feathers-pinia get requests')
    }

    requestCount.value++
    _hasBeenRequested.value = true // never resets
    _isPending.value = true
    _hasLoaded.value = false
    _error.value = null

    try {
      const response = await store.get(_id as Id, _params as any)

      // Keep a list of retrieved ids
      if (response && _id) {
        ids.value.push(_id)
      }
      _hasLoaded.value = true

      return response
    } catch (err: any) {
      _error.value = err
      throw err
    } finally {
      _isPending.value = false
    }
  }

  const makeRequest = async (id: Id, params: MaybeRef<Params<Query>>) => {
    if (!id) return
    request.value = get(id, params)
    await request.value
  }

  // Watch the id
  if (onServer && _watch) {
    watch(
      id,
      async () => {
        await makeRequest(id as any, params)
      },
      { immediate },
    )
  }

  return {
    id, // Ref<Id | null>
    params, // Ref<GetClassParams>
    isSsr, // ComputedRef<boolean>

    // Data
    data, // ComputedRef<M | null>
    ids, // Ref<Id[]>
    getFromStore, // (id: Id | null, params: Params<Query>) => M | undefined

    // Requests & Watching
    get, // GetFn<M>
    request, // Ref<Promise<M | undefined>>
    requestCount, // Ref<number>
    queryWhen, // (queryWhenFn: () => boolean) => void

    // Request State
    isPending, // Ref<boolean>
    hasBeenRequested, // Ref<boolean>
    hasLoaded, // Ref<boolean>
    error, // ComputedRef<any>
    clearError, // () => void
  }
}
