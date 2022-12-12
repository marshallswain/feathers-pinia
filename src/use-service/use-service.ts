import type { MaybeRef } from '../utility-types'
import type { ModelInstance } from '../use-base-model'
import type { Id } from '@feathersjs/feathers'
import type { UseFindWatchedOptions, UseGetOptions, GetClassParams, HandleEvents, AnyData } from './types'

import { Service } from '@feathersjs/feathers'
import { ref, computed, unref } from 'vue-demi'
import { useFind as useFind, UseFindParams } from '../use-find'
import { useGet as useGet } from '../use-get'
import { useFindWatched as useFindWatched } from '../use-find-watched'
import { useGetWatched as useGetWatched } from '../use-get-watched'
import { useServiceLocal } from './use-service-local-queries'
import { useServiceEvents } from './use-service-events'

import { useServicePending } from './use-service-pending'
import { useServicePagination } from './use-service-pagination'
import { useServiceApiFeathers } from './use-service-api-feathers'
// import EventEmitter from 'events'
import { useServiceEventLocks } from './use-service-event-locks'
import { useAllStorageTypes } from './use-all-storage-types'

export type UseServiceOptions<M extends AnyData> = {
  service: Service
  idField: string
  whitelist?: string[]
  paramsForServer?: string[]
  skipRequestIfExists?: boolean
  ssr?: MaybeRef<boolean>
  handleEvents?: HandleEvents<M>
  debounceEventsTime?: number
  debounceEventsGuarantee?: boolean
}
export interface UseServiceOptionsExtended<M extends AnyData, ModelFunc extends (data: ModelInstance<M>) => any>
  extends UseServiceOptions<M> {
  ModelFn: ModelFunc
}

const makeDefaultOptions = () => ({
  skipRequestIfExists: false,
})

export const useService = <
  M extends AnyData,
  D extends AnyData,
  Q extends AnyData,
  ModelFunc extends (data: ModelInstance<M>) => any,
>(
  _options: UseServiceOptionsExtended<M, ModelFunc>,
) => {
  const options = Object.assign({}, makeDefaultOptions(), _options)
  const ModelFn = _options.ModelFn

  const service = computed(() => options.service)
  const whitelist = ref(options.whitelist ?? [])
  const paramsForServer = ref(options.paramsForServer ?? [])
  const skipRequestIfExists = ref(options.skipRequestIfExists ?? false)
  const idField = ref(options.idField)

  // pending state
  const pendingState = useServicePending()

  // storage
  const { itemStorage, tempStorage, cloneStorage, clone, commit, reset, removeFromStore, addToStore, clearAll } =
    useAllStorageTypes<M, ModelFunc>({
      ModelFn,
      afterClear: () => {
        pendingState.clearAllPending()
      },
    })

  const isSsr = computed(() => {
    const ssr = unref(options.ssr)
    return !!ssr
  })

  // pagination
  const { pagination, updatePaginationForQuery, unflagSsr } = useServicePagination({
    idField,
    isSsr,
  })

  // local data filtering
  const { findInStore, countInStore, getFromStore } = useServiceLocal<M, Q>({
    idField,
    itemStorage,
    tempStorage,
    whitelist,
    paramsForServer,
  })

  // feathers service
  const serviceMethods = useServiceApiFeathers<M, D, Q>({
    service: options.service,
    addToStore,
  })

  // event locks
  const eventLocks = useServiceEventLocks()

  // events
  useServiceEvents({
    idField: idField.value,
    ModelFn: ModelFn,
    onAddOrUpdate: addToStore,
    onRemove: removeFromStore,
    service: service.value,
    handleEvents: options.handleEvents,
    debounceEventsGuarantee: options.debounceEventsGuarantee,
    debounceEventsTime: options.debounceEventsTime,
    toggleEventLock: eventLocks.toggleEventLock,
    eventLocks: eventLocks.eventLocks,
  })

  const serviceUtils = {
    useFind: function (_params: MaybeRef<UseFindParams>) {
      const params: any = unref(_params)
      params.store = this
      return useFind(params)
    },
    useGet: function (_id: MaybeRef<Id | null>, _params: MaybeRef<GetClassParams> = {}) {
      const params: any = unref(_params)
      params.store = this
      return useGet(_id as Id, _params as MaybeRef<any>)
    },
    useGetOnce: function (_id: MaybeRef<Id | null>, _params: MaybeRef<GetClassParams> = {}) {
      const params = unref(_params)
      Object.assign(params, { store: this, immediate: false, onServer: true })
      const results = this.useGet(_id as Id, _params as MaybeRef<any>)
      results.queryWhen(() => !results.data.value)
      results.get()
      return results
    },
    useFindWatched: function (options: UseFindWatchedOptions) {
      return useFindWatched({ model: ModelFn, ...(options as any) })
    },
    // alias to useGetWatched, doesn't require passing the model
    useGetWatched: function (options: UseGetOptions) {
      return useGetWatched({ model: ModelFn as any, ...options })
    },
  }

  const store = {
    // service
    ...(service.value ? { service } : {}),
    Model: computed(() => ModelFn),
    whitelist,
    paramsForServer,
    skipRequestIfExists,
    isSsr,

    // items
    idField,
    itemsById: itemStorage.byId,
    items: itemStorage.list,
    itemIds: itemStorage.ids,

    // temps
    tempsById: tempStorage.byId,
    temps: tempStorage.list,
    tempIds: tempStorage.ids,

    // clones
    clonesById: cloneStorage.byId,
    clones: cloneStorage.list,
    cloneIds: cloneStorage.ids,
    clone,
    commit,
    reset,

    // options
    pagination,
    updatePaginationForQuery,
    unflagSsr,

    // local queries
    findInStore,
    countInStore,
    getFromStore,
    removeFromStore,
    addToStore,
    clearAll,

    ...pendingState,
    ...eventLocks,
    ...serviceMethods,
    ...serviceUtils,
  }

  return store
}
