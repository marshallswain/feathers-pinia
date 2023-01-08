import type { MaybeRef } from '../utility-types'
import type { FeathersInstance, ModelInstance } from '../use-base-model'
import type { Id, Query } from '@feathersjs/feathers'
import type { Params } from '../types'
import type { UseFindWatchedOptions, UseGetOptions, GetClassParams, HandleEvents, AnyData } from './types'

import { ClientService } from '@feathersjs/feathers'
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
import { useServiceEventLocks } from './use-service-event-locks'
import { useAllStorageTypes } from './use-all-storage-types'

export type UseServiceOptions<M extends AnyData, D extends AnyData, Q extends Query> = {
  service: ClientService<FeathersInstance<M, Q>, D, Params<Q>>
  idField: string
  whitelist?: string[]
  paramsForServer?: string[]
  skipRequestIfExists?: boolean
  ssr?: MaybeRef<boolean>
  handleEvents?: HandleEvents<M>
  debounceEventsTime?: number
  debounceEventsGuarantee?: boolean
}
export interface UseServiceOptionsExtended<
  M extends AnyData,
  D extends AnyData,
  Q extends Query,
  ModelFunc extends (data: ModelInstance<M>) => any,
> extends UseServiceOptions<M, D, Q> {
  Model?: ModelFunc
}

const makeDefaultOptions = () => ({
  skipRequestIfExists: false,
})

export const useService = <
  M extends AnyData,
  D extends AnyData,
  Q extends Query,
  ModelFunc extends (data: ModelInstance<M>) => any,
>(
  _options: UseServiceOptionsExtended<M, D, Q, ModelFunc>,
) => {
  const options = Object.assign({}, makeDefaultOptions(), _options)

  let Model = options.Model || (((val: any) => val) as ModelFunc)
  const getModel = () => Model
  const setModel = (model: ModelFunc) => {
    Model = model
  }

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
      getModel,
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
  const serviceMethods = useServiceApiFeathers<M, D, Q>({ service: options.service })

  // event locks
  const eventLocks = useServiceEventLocks()

  // events
  useServiceEvents({
    idField: idField.value,
    getModel,
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
    useFind: function (params: MaybeRef<UseFindParams>) {
      const _params: any = params
      Object.assign(_params.value || params, { store: this })
      return useFind(_params)
    },
    useGet: function (_id: MaybeRef<Id | null>, params: MaybeRef<GetClassParams> = {}) {
      const _params: any = params
      Object.assign(_params.value || params, { store: this })
      return useGet(_id as Id, _params as MaybeRef<any>)
    },
    useGetOnce: function (_id: MaybeRef<Id | null>, params: MaybeRef<GetClassParams> = {}) {
      const _params: any = params
      Object.assign(_params.value || params, { store: this, immediate: false, onServer: true })
      const results = this.useGet(_id as Id, _params as MaybeRef<any>)
      results.queryWhen(() => !results.data.value)
      results.get()
      return results
    },
    useFindWatched: function (options: UseFindWatchedOptions) {
      const Model = getModel()
      return useFindWatched({ model: Model, ...(options as any) })
    },
    // alias to useGetWatched, doesn't require passing the model
    useGetWatched: function (options: UseGetOptions) {
      const Model = getModel()
      return useGetWatched({ model: Model as any, ...options })
    },
  }

  const store = {
    // service
    service,
    Model,
    setModel,
    idField,
    whitelist,
    paramsForServer,
    skipRequestIfExists,
    isSsr,

    // items
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
