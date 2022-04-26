import {
  ServiceStoreDefaultActions,
  UpdatePaginationForQueryOptions,
  RequestType,
  AnyDataOrArray,
  ServiceStoreDefaultGetters,
  ServiceStoreDefaultState,
  HandleFindResponseOptions,
  HandleFindErrorOptions,
  AnyData,
  MakeServiceActionsOptions
} from './types'
import { Params } from '../types'
import { Id, NullableId } from '@feathersjs/feathers'
import { _ } from '@feathersjs/commons'
import fastCopy from 'fast-copy'
import {
  getId,
  getTempId,
  getAnyId,
  getQueryInfo,
  keyBy,
  assignTempId,
  cleanData,
  restoreTempIds,
  getArray,
  hasOwn,
  getSaveParams,
} from '../utils'
import { unref } from 'vue-demi'
import { StateTree, _GettersTree } from 'pinia'
import { BaseModel } from './base-model'
import { MaybeArray, MaybeRef, TypedActions } from '../utility-types'

type ServiceStoreTypedActions<M extends BaseModel = BaseModel> = TypedActions<
  ServiceStoreDefaultState,
  ServiceStoreDefaultGetters,
  ServiceStoreDefaultActions<M>
>

export function makeActions<
  M extends BaseModel = BaseModel,
  S extends StateTree = StateTree,
  G extends _GettersTree<S> = {},
  A = {}
>(
  options: MakeServiceActionsOptions<M, S, G, A>
): ServiceStoreDefaultActions<M> & A {
  const defaultActions: ServiceStoreTypedActions<M> = {
    find(_params?: MaybeRef<Params>) {
      const params = getSaveParams(_params)
      const { query = {} } = params
      const isPaginated =
        params.paginate === true || hasOwn(query, '$limit') || hasOwn(query, '$skip')

      // For client-side services, like feathers-memory, paginate.default must be truthy.
      if (isPaginated) {
        params.paginate = { default: true }
      }

      this.setPendingById('Model', 'find', true)

      const info = getQueryInfo(params, {})
      const qidData = this.pagination[info.qid]
      // @ts-expect-error todo
      const queryData = qidData?.[info.queryId]
      const pageData = queryData?.[info.pageId as string]

      let ssrPromise

      if (pageData?.ssr) {
        const ssrResponse = {
          data: pageData.ids.map((id: Id) => this.getFromStore(id)),
          limit: pageData.pageParams.$limit,
          skip: pageData.pageParams.$skip,
          total: queryData.total,
          fromSsr: true,
        }
        ssrPromise = Promise.resolve(ssrResponse)
        if (!params.preserveSsr) {
          this.unflagSsr(params)
        }
      }

      return (ssrPromise || this.service.find(params as any))
        .then((response: any) => this.handleFindResponse({ params, response }))
        .catch((error: any) => this.handleFindError({ params, error }))
        .finally(() => {
          this.setPendingById('Model', 'find', false)
        })
    },
    /**
     * Handle the response from the find action.
     *
     * @param payload consists of the following two params
     *   @param params - Remember that these params aren't what was sent to the
     *         Feathers client.  The client modifies the params object.
     *   @param response
     */
    async handleFindResponse({ params, response }: HandleFindResponseOptions) {
      const { qid = 'default', query, preserveSsr = false } = params

      this.addOrUpdate(response.data || response)

      // The pagination data will be under `pagination.default` or whatever qid is passed.
      response.data && this.updatePaginationForQuery({ qid, response, query, preserveSsr })

      // Swap out the response records for their Vue-observable store versions
      const data = response.data || response
      const mappedFromState = data.map((i: any) => this.itemsById[getId(i)])
      if (mappedFromState[0] !== undefined) {
        response.data ? (response.data = mappedFromState) : (response = mappedFromState)
      }

      response = await this.afterFind(response)

      return response
    },
    async afterFind(response: any) {
      return response
    },
    handleFindError({ error }: HandleFindErrorOptions) {
      //  commit('setError', { method: 'find', params, error })
      return Promise.reject(error)
    },

    count(_params?: MaybeRef<Params>) {
      const params = getSaveParams(_params)
      const { query = {} } = params

      query.$limit = 0

      Object.assign(params, { query })

      this.setPendingById('Model', 'count', true)

      return this.service.find(params as any).finally(() => {
        this.setPendingById('Model', 'count', false)
      })
    },

    // Supports passing params the feathers way: `get(id, params)`
    // Does NOT support the old array syntax:
    // `get([null, params])` which was only needed for Vuex
    get(id: Id, _params?: MaybeRef<Params>) {
      const params = getSaveParams(_params)

      const skipRequestIfExists = params.skipRequestIfExists || this.skipRequestIfExists
      delete params.skipRequestIfExists

      // If the records is already in store, return it
      const existingItem = this.getFromStore(id, params)
      if (existingItem && skipRequestIfExists) {
        return Promise.resolve(existingItem)
      }

      this.setPendingById('Model', 'get', true)

      return this.service
        .get(id, params)
        .then((data: any) => {
          this.addOrUpdate(data)
          this.setPendingById('Model', 'get', false)
          return this.itemsById[id]
        })
        .catch((error: Error) => {
          // commit('setError', { method: 'get', error })
          this.setPendingById('Model', 'get', false)
          return Promise.reject(error)
        })
    },

    create(data: AnyDataOrArray, _params?: MaybeRef<Params>) {
      const params = getSaveParams(_params)

      // @ts-expect-error todo
      const { tempIdField } = this
      
      if (!Array.isArray(data)) {
        this.setPendingById(getId(data) || data[tempIdField], 'create', true)
      }
      
      return this.service
        .create(cleanData(data), params)
        .then((response: any) => {
          return this.addOrUpdate(restoreTempIds(data, response))
        })
        .catch((error: Error) => {
          // commit('setError', { method: 'create', error })
          return Promise.reject(error)
        })
        .finally(() => {
          if (!Array.isArray(data)) {
            this.setPendingById(getId(data) || data[tempIdField], 'create', false)
          }
        })
    },
    update(id: Id, data: AnyData, _params?: MaybeRef<Params>) {
      const params = getSaveParams(_params)

      this.setPendingById(id, 'update', true)

      return this.service
        .update(id, cleanData(data), params)
        .then((data: any) => {
          return this.addOrUpdate(data)
        })
        .catch((error: Error) => {
          // commit('setError', { method: 'update', error })
          return Promise.reject(error)
        })
        .finally(() => {
          this.setPendingById(id, 'update', false)
        })
    },
    patch(id: NullableId, data: any, _params?: MaybeRef<Params>) {
      const params = getSaveParams(_params);

      if (params && params.data) {
        data = params.data
      }
      this.setPendingById(id, 'patch', true)

      return this.service
        .patch(id, cleanData(data), params)
        .then((data: any) => {
          return this.addOrUpdate(data)
        })
        .catch((error: Error) => {
          // commit('setError', { method: 'update', error })
          return Promise.reject(error)
        })
        .finally(() => {
          this.setPendingById(id, 'patch', false)
        })
    },

    /**
     * Sends API request to remove the record with the given id.
     * Calls `removeFromStore` after response.
     * @param id
     * @param params
     * @returns
     */
    remove(id: NullableId, _params?: MaybeRef<Params>) {
      const params = getSaveParams(_params)

      this.setPendingById(id, 'remove', true)

      return this.service
        .remove(id, params)
        .then((data: any) => {
          this.setPendingById(id, 'remove', false)
          this.removeFromStore(data)
          return data
        })
        .catch((error: Error) => {
          // commit('setError', { method: 'remove', error })
          this.setPendingById(id, 'remove', false)
          return Promise.reject(error)
        })
    },
    removeFromStore<T>(data: T): T {
      const { items } = getArray(data)
      const idsToRemove = items
        .map((item: any) => (getId(item) != null ? getId(item) : getTempId(item)))
        .filter((id: any) => id != null)

      this.itemsById = _.omit(this.itemsById, ...idsToRemove)

      this.clonesById = _.omit(this.clonesById, ...idsToRemove)
      this.pendingById = _.omit(this.pendingById, ...idsToRemove)
      this.tempsById = _.omit(this.tempsById, ...idsToRemove)

      return data
    },
    /**
     * An alias for addOrUpdate
     * @param data a single record or array of records.
     * @returns data added or modified in the store.
     *  If you pass an array, you get an array back.
     */
    addToStore(data: AnyDataOrArray): MaybeArray<any> {
      return this.addOrUpdate(data)
    },
    addOrUpdate(data: AnyDataOrArray): MaybeArray<any> {
      const { items, isArray } = getArray(data)

      // Assure each item is an instance
      items.forEach((item: any, index: number) => {
        if (this.isSsr || !(item instanceof options.Model)) {
          const classes = { [this.servicePath]: options.Model }
          items[index] = new classes[this.servicePath](item)
        }
      })

      // Move items with both __tempId and idField from tempsById to itemsById
      const withBoth = items.filter((i: any) => getId(i) != null && getTempId(i) != null)
      withBoth.forEach((item: any) => {
        const id = getId(item)
        const existingTemp = this.tempsById[item.__tempId]
        if (existingTemp) {
          this.itemsById[id] = existingTemp
          Object.assign(this.itemsById[id], item)
          delete this.tempsById[item.__tempId]
          // @ts-expect-error todo
          delete this.itemsById[id].__tempId
        }
        delete item.__tempId
      })

      // Save items that have ids
      const withId = items.filter((i: any) => getId(i) != null)
      const itemsById = keyBy(withId)
      Object.assign(this.itemsById, itemsById)

      // Save temp items
      const temps = items.filter((i: any) => getId(i) == null).map((i: any) => assignTempId(i))
      const tempsById = keyBy(temps, (i: any) => i.__tempId)
      Object.assign(this.tempsById, tempsById)

      return isArray ? items : items[0]
    },

    clearAll() {
      this.itemsById = {}
      this.tempsById = {}
      this.clonesById = {}
    },

    clone(item: M, data = {}): M {
      // @ts-expect-error todo
      const placeToStore = item.__tempId != null ? 'tempsById' : 'itemsById'
      const id = getAnyId(item)
      const originalItem = this[placeToStore][id]
      const existing = this.clonesById[getAnyId(item)]
      if (existing && existing.constructor.name === originalItem.constructor.name) {
        const readyToReset = Object.assign(existing, originalItem, data)
        Object.keys(readyToReset).forEach((key) => {
          if (!hasOwn(originalItem, key)) {
            delete readyToReset[key]
          }
        })
        // @ts-expect-error todo
        return readyToReset
      } else {
        const clone = fastCopy(originalItem)
        Object.defineProperty(clone, '__isClone', {
          value: true,
          enumerable: false,
        })
        Object.assign(clone, data)

        this.clonesById[id] = clone
        // @ts-expect-error todo
        return this.clonesById[id] // Must return the item from the store
      }
    },
    commit(item: M): M | undefined {
      const id = getAnyId(item)
      if (id != null) {
        // @ts-expect-error todo
        const placeToStore = item.__tempId != null ? 'tempsById' : 'itemsById'
        this[placeToStore][id] = fastCopy(this.clonesById[id])
        // @ts-expect-error todo
        return this.itemsById[id]
      }
    },

    /**
     * Stores pagination data on state.pagination based on the query identifier
     * (qid) The qid must be manually assigned to `params.qid`
     */
    updatePaginationForQuery({
      qid,
      response,
      query = {},
      preserveSsr = false,
    }: UpdatePaginationForQueryOptions) {
      const { data, total } = response
      const { idField } = this
      const ids = data.map((i: any) => getId(i, idField))
      const queriedAt = new Date().getTime()
      const { queryId, queryParams, pageId, pageParams } = getQueryInfo({ qid, query }, response)

      if (!this.pagination[qid]) {
        this.pagination[qid] = {}
      }

      if (!hasOwn(query, '$limit') && hasOwn(response, 'limit')) {
        this.pagination.defaultLimit = response.limit
      }
      if (!hasOwn(query, '$skip') && hasOwn(response, 'skip')) {
        this.pagination.defaultSkip = response.skip
      }

      const mostRecent = {
        query,
        queryId,
        queryParams,
        pageId,
        pageParams,
        queriedAt,
        total,
      }

      // @ts-expect-error todo
      const existingPageData = this.pagination[qid]?.[queryId]?.[pageId as string]

      const qidData = this.pagination[qid] || {}
      Object.assign(qidData, { mostRecent })
      // @ts-expect-error todo
      qidData[queryId] = qidData[queryId] || {}
      const queryData = {
        total,
        queryParams,
      }
      // @ts-expect-error todo
      Object.assign(qidData[queryId], queryData)

      const ssr = preserveSsr ? existingPageData?.ssr : unref(options.ssr)

      const pageData = {
        [pageId as string]: { pageParams, ids, queriedAt, ssr: !!ssr },
      }
      // @ts-expect-error todo
      Object.assign(qidData[queryId], pageData)

      const newState = Object.assign({}, this.pagination[qid], qidData)

      this.pagination[qid] = newState
    },

    setPendingById(id: NullableId, method: RequestType, val: boolean) {
      if (id == null) return;

      // @ts-expect-error todo
      this.pendingById[id] = this.pendingById[id] || { [method]: val }
      // @ts-expect-error todo
      this.pendingById[id][method] = val
    },
    hydrateAll() {
      this.addToStore(this.items)
    },
    toggleEventLock(idOrIds: MaybeArray<Id>, event: string) {
      setEventLockState(idOrIds, event, true, this)
    },
    unflagSsr(params: Params) {
      const queryInfo = getQueryInfo(params, {})
      const { qid, queryId, pageId } = queryInfo
      // @ts-expect-error todo
      const pageData = this.pagination[qid]?.[queryId]?.[pageId as string]
      pageData.ssr = false
    }
  }

  return Object.assign(defaultActions, options.actions)
}

function setEventLockState(data: MaybeArray<Id>, event: string, val: boolean, store: any) {
  const { items: ids } = getArray(data)
  ids.forEach((id) => {
    const currentLock = store.eventLocksById[event][id]
    if (currentLock) {
      delete store.eventLocksById[event][id]
    } else {
      store.eventLocksById[event][id] = true
    }
  })
}
