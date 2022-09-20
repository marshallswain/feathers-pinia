import type { Params } from './types'
import type { ServiceStoreDefault, GetFn, GetClassParamsStandalone, GetClassParams } from './service-store/types'
import type { MaybeRef } from './utility-types'
import type { Id } from '@feathersjs/feathers'
import { computed, ComputedRef, isReadonly, isRef, Ref, ref, unref, watch } from 'vue-demi'
import { BaseModel } from './service-store/base-model'

type Store<M extends BaseModel> = ServiceStoreDefault<M>

export function useGet<M extends BaseModel>(id: Id, params: MaybeRef<GetClassParamsStandalone<M>>) {
  return new Get(id, params)
}

export class Get<M extends BaseModel> {
  id: Ref<Id | null>
  params: Ref<GetClassParams>
  isSsr: ComputedRef<boolean>

  // Data
  data: ComputedRef<M | null>
  ids: Ref<Id[]>
  getFromStore: (id: Id | null, params: Params) => M | undefined

  // Requests & Watching
  get: GetFn<M>
  request: Ref<Promise<M | undefined>>
  requestCount: Ref<number>
  queryWhen: (queryWhenFn: () => boolean) => void

  // Request State
  isPending: Ref<boolean>
  hasBeenRequested: Ref<boolean>
  hasLoaded: Ref<boolean>
  error: ComputedRef<any>
  clearError: () => void

  constructor(_id: MaybeRef<Id | null>, _params: MaybeRef<GetClassParamsStandalone<M>>) {
    const store = unref(_params).store as Store<M>
    const id = isRef(_id) ? (isReadonly(_id) ? ref(_id.value) : _id) : ref(_id)
    const params = isRef(_params) ? (isReadonly(_params) ? ref(_params.value) : _params) : ref(_params)

    // Remove the store from the provided params
    delete (params.value as GetClassParams).store

    /*** ID & PARAMS ***/
    this.id = id as Ref<Id | null>
    this.params = params as Ref<GetClassParams>
    const { immediate = true, watch: _watch = true, onServer = false } = params.value
    this.isSsr = computed(() => store.isSsr)

    /*** REQUEST STATE ***/
    const isPending = ref(false)
    const hasBeenRequested = ref(false)
    const hasLoaded = ref(false)
    const error = ref(null)
    this.isPending = computed(() => isPending.value)
    this.hasBeenRequested = computed(() => hasBeenRequested.value)
    this.hasLoaded = computed(() => hasLoaded.value)
    this.error = computed(() => error.value)
    this.clearError = () => (error.value = null)

    /*** STORE ITEMS ***/
    this.ids = ref([])
    const mostRecentId = computed(() => {
      return this.ids.value.length && this.ids.value[this.ids.value.length - 1]
    })
    this.data = computed(() => {
      if (isPending.value && mostRecentId.value != null) {
        return store.getFromStore(mostRecentId.value, params) || null
      }
      return store.getFromStore(id.value, params) || null
    })
    this.getFromStore = store.getFromStore

    /*** QUERY WHEN ***/
    let queryWhen = () => true
    this.queryWhen = (queryWhenFn: () => boolean) => {
      queryWhen = queryWhenFn
    }

    /*** SERVER FETCHING ***/
    this.requestCount = ref(0)
    this.request = ref(null) as any
    this.get = async (__id?: MaybeRef<Id>, params?: MaybeRef<Params>) => {
      const _id = unref(__id || id)
      const _params = unref(params)

      if (!queryWhen()) return

      if (_id == null) {
        throw new Error('id is required for feathers-pinia get requests')
      }

      this.requestCount.value++
      hasBeenRequested.value = true // never resets
      isPending.value = true
      hasLoaded.value = false
      error.value = null

      try {
        const response = await store.get(_id as Id, _params)

        // Keep a list of retrieved ids
        if (response && _id) {
          this.ids.value.push(_id)
        }
        hasLoaded.value = true

        return response
      } catch (err: any) {
        error.value = err
        throw err
      } finally {
        isPending.value = false
      }
    }

    const request = this.request
    const makeRequest = async (id: Id, params: MaybeRef<Params>) => {
      if (!id) return
      request.value = this.get(id, params)
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

    return this
  }
}
