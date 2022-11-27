import { Service } from '@feathersjs/feathers'
import { ref, computed, unref, del } from 'vue-demi'
import { MaybeRef } from '../utility-types'

import type { Id } from '@feathersjs/feathers'
import type {
  UseFindWatchedOptions,
  UseGetOptions,
  FindClassParams,
  FindClassParamsStandalone,
  GetClassParams,
  HandleEvents,
  AnyData,
} from './types'

import { useFind as _useFind } from '../use-find'
import { useGet as _useGet } from '../use-get'
import { useFindWatched as _useFindWatched } from '../use-find-watched'
import { useGetWatched as _useGetWatched } from '../use-get-watched'
import { useServiceLocal } from './use-service-local'
import { useServiceTemps } from './use-service-temps'
import { useServiceEvents } from './use-service-events'
import { useServiceClones } from './use-service-clones'
import { useServicePending } from './use-service-pending'
import { useServiceStorage } from './use-service-storage'
import { useServicePagination } from './use-service-pagination'
import { useServiceApiFeathers } from './use-service-api-feathers'
import { markAsClone } from './utils'

export type UseFeathersServiceOptions = {
  service: Service
  Model?: any
  idField?: string
  tempIdField?: string
  whitelist?: string[]
  paramsForServer?: string[]
  skipRequestIfExists?: boolean
  ssr?: MaybeRef<boolean>
  handleEvents?: HandleEvents
  debounceEventsTime?: number
  debounceEventsGuarantee?: boolean
}

const makeDefaultOptions = () => ({
  idField: 'id',
  tempIdField: '__tempId',
  skipRequestIfExists: false,
})

export const useService = (_options: UseFeathersServiceOptions) => {
  const options = Object.assign({}, makeDefaultOptions(), _options)
  const ModelFn = options.Model
  const service = computed(() => options.service)
  const whitelist = ref(options.whitelist ?? [])
  const paramsForServer = ref(options.paramsForServer ?? [])
  const skipRequestIfExists = ref(options.skipRequestIfExists ?? false)

  // Make sure the provided item is a model "instance" (in quotes because it's not a class)
  const assureInstance = (item: AnyData) => (item.__modelName ? item : ModelFn(item))

  // item storage
  const idField = ref(options.idField)
  const itemStorage = useServiceStorage({
    getId: (item) => item[idField.value],
    onRead: assureInstance,
    beforeWrite: assureInstance,
  })

  // temp item storage
  const tempIdField = ref(options.tempIdField)
  const { tempStorage, moveTempToItems } = useServiceTemps({
    getId: (item) => item[tempIdField.value],
    removeId: (item) => del(item, tempIdField.value),
    itemStorage,
    onRead: assureInstance,
    beforeWrite: assureInstance,
  })

  // clones
  const { cloneStorage, clone, commit, reset } = useServiceClones({
    itemStorage,
    tempStorage,
    onRead: assureInstance,
    beforeWrite: (item) => {
      markAsClone(item)
      return assureInstance(item)
    },
  })

  const isSsr = computed(() => {
    const ssr = unref(options.ssr)
    return !!ssr
  })

  // pending state
  const pendingState = useServicePending()

  // pagination
  const { pagination, updatePaginationForQuery, unflagSsr } = useServicePagination({
    idField,
    isSsr,
  })

  // local data filtering
  const { findInStore, countInStore, getFromStore, removeFromStore, addToStore, addOrUpdate, hydrateAll, clearAll } =
    useServiceLocal({
      idField,
      tempIdField,
      itemStorage,
      tempStorage,
      whitelist,
      paramsForServer,
      afterRemove: (item: any) => {
        cloneStorage.remove(item)
      },
      afterClear: () => {
        cloneStorage.clear()
        pendingState.clearAll()
      },
      moveTempToItems,
    })

  // feathers service
  const serviceMethods = useServiceApiFeathers({
    service: options.service,
    idField,
    tempIdField,
    pagination,
    getFromStore,
    itemStorage,
    skipRequestIfExists: options.skipRequestIfExists,
    setPending: pendingState.setPending,
    setPendingById: pendingState.setPendingById,
    updatePaginationForQuery,
    unflagSsr,
    removeFromStore,
    addOrUpdate,
  })

  // events
  useServiceEvents({
    idField: idField.value,
    Model: ModelFn,
    onAddOrUpdate: addToStore,
    onRemove: removeFromStore,
    service: service.value,
    handleEvents: options.handleEvents,
    debounceEventsGuarantee: options.debounceEventsGuarantee,
    debounceEventsTime: options.debounceEventsTime,
  })

  const serviceUtils = {
    useFind: function (params: MaybeRef<FindClassParams>) {
      const _params = params.value || params
      _params.store = this
      return _useFind(params as MaybeRef<FindClassParamsStandalone>)
    },
    useGet: function (_id: MaybeRef<Id | null>, params: MaybeRef<GetClassParams> = {}) {
      const _params = params.value || params
      _params.store = this
      return _useGet(_id as Id, _params as MaybeRef<any>)
    },
    useGetOnce: function (_id: MaybeRef<Id | null>, _params: MaybeRef<GetClassParams> = {}) {
      Object.assign(_params.value || _params, { store: this, immediate: false, onServer: true })
      const results = this.useGet(_id as Id, _params as MaybeRef<any>)
      results.queryWhen(() => !results.data.value)
      results.get()
      return results
    },
    useFindWatched: function (options: UseFindWatchedOptions) {
      return _useFindWatched({ model: ModelFn, ...(options as any) })
    },
    // alias to useGetWatched, doesn't require passing the model
    useGetWatched: function (options: UseGetOptions) {
      return _useGetWatched({ model: ModelFn, ...options })
    },
  }

  const store = {
    // service
    ...(service.value ? { service } : {}),
    Model: computed(() => ModelFn),

    // items
    idField,
    itemsById: itemStorage.byId,
    items: itemStorage.list,
    itemIds: itemStorage.ids,

    // temps
    tempIdField,
    tempsById: tempStorage.byId,
    temps: tempStorage.list,
    tempIds: tempStorage.ids,

    // clones
    clonesById: cloneStorage.byId,
    clones: cloneStorage.list,
    cloneIds: cloneStorage.ids,
    clone,
    commit,

    // options
    pagination,
    whitelist,
    paramsForServer,
    skipRequestIfExists,
    isSsr,

    // getter functions
    findInStore,
    countInStore,
    getFromStore,

    // pending (conditional based on if service was provided)
    ...pendingState,

    // service actions (conditional based on if service was provided)
    ...serviceMethods,

    // service utils
    ...serviceUtils,

    // store handlers
    removeFromStore,
    addToStore,
    addOrUpdate,
    clearAll,
    reset,
    hydrateAll,
  }

  return store
}
