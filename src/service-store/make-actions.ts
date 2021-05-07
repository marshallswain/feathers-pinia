import { Model, ServiceOptions, ServiceActions, UpdatePaginationForQueryOptions, ServiceState, ServiceGetters, ServiceStore } from './types'
import { EventName, Params } from '../types'
import { RequestType, AnyData } from './types'
import { Id, PaginationOptions } from '@feathersjs/feathers'
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
} from '../utils'
import { DefineStoreOptions, Store } from 'pinia'

export function makeActions(
  options: ServiceOptions
): ServiceActions {
  return {
    ...(options.actions || {}),

    find(requestParams: Params) {
      let params: Params = requestParams || {}
      params = fastCopy(params)

      // For working with client-side services, paginate.default must be truthy.
      if (params.paginate === true) {
        params.paginate = { default: true }
      }

      const {
        setPendingById,
        service,
        handleFindResponse,
        handleFindError
      } = (this as unknown as ServiceStore)

      setPendingById('Model', 'find', true)

      return service
        .find(params)
        .then((response: any) => handleFindResponse({ params, response }))
        .catch((error: any) => handleFindError({ params, error }))
        .finally(() => {
          setPendingById('Model', 'find', false)
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
    async handleFindResponse({ params, response }: { params: Params; response: any }) {
      const { qid = 'default', query } = params

      const {
        addOrUpdate,
        updatePaginationForQuery,
        itemsById,
        afterFind
      } = (this as unknown as ServiceStore)

      addOrUpdate(response.data || response)

      // The pagination data will be under `pagination.default` or whatever qid is passed.
      response.data && updatePaginationForQuery({ qid, response, query })

      // Swap out the response records for their Vue-observable store versions
      const data = response.data || response
      const mappedFromState = data.map((i: any) => itemsById[getId(i)])
      if (mappedFromState[0] !== undefined) {
        response.data ? (response.data = mappedFromState) : (response = mappedFromState)
      }

      response = await afterFind(response)

      return response
    },
    async afterFind(response: any) {
      return response
    },
    handleFindError({ params, error }: { params: Params; error: any }) {
      //  commit('setError', { method: 'find', params, error })
      return Promise.reject(error)
    },

    count(params: Params) {
      params = params || {}
      params = fastCopy(params)

      if (!params.query) {
        throw 'params must contain a `query` object'
      }

      params.query.$limit = 0

      const {
        setPendingById,
        service
      } = this as unknown as ServiceStore;

      setPendingById('Model', 'count', true)

      return service.find(params as any).finally(() => {
        this.setPendingById('Model', 'count', false)
      })
    },

    // Supports passing params the feathers way: `get(id, params)`
    // Does NOT support the old array syntax: `get([null, params])` which was only needed for Vuex
    get(id: Id, params: Params = {}) {
      params = fastCopy(params)

      const {
        getFromStore,
        service,
        addOrUpdate,
        setPendingById
      } = (this as unknown as ServiceStore)

      // TODO @marshallswain: `skipRequestIfExists` is defined nowhere else! remove it or add it to state?
      const skipRequestIfExists = params.skipRequestIfExists || this.skipRequestIfExists
      delete params.skipRequestIfExists

      // If the records is already in store, return it
      const existingItem = getFromStore(id, params)
      if (existingItem && skipRequestIfExists) {
        return Promise.resolve(existingItem)
      }

      setPendingById('Model', 'get', true)

      return service
        .get(id, params)
        .then((data: any) => {
          addOrUpdate(data)
          setPendingById('Model', 'get', false)
          return this.itemsById[id]
        })
        .catch((error: Error) => {
          // commit('setError', { method: 'get', error })
          setPendingById('Model', 'get', false)
          return Promise.reject(error)
        })
    },

    create(data: any, params: Params) {
      const { 
        idField, 
        tempIdField,
        setPendingById,
        service,
        addOrUpdate
      } = this as unknown as ServiceStore
      params = fastCopy(params) || {}

      setPendingById(getId(data) || data[tempIdField], 'create', true)

      return service
        .create(cleanData(data), params)
        .then((response: any) => {
          return addOrUpdate(restoreTempIds(data, response))
        })
        .catch((error: Error) => {
          // commit('setError', { method: 'create', error })
          return Promise.reject(error)
        })
        .finally(() => {
          setPendingById(getId(data) || data[tempIdField], 'create', false)
        })
    },
    update(id: Id, data: any, params: Params) {
      params = fastCopy(params) || {}

      const {
        setPendingById,
        service,
        addOrUpdate
      } = this as unknown as ServiceStore;

      this.setPendingById(id, 'update', true)

      return service
        .update(id, cleanData(data), params)
        .then((data: any) => {
          return addOrUpdate(data)
        })
        .catch((error: Error) => {
          // commit('setError', { method: 'update', error })
          return Promise.reject(error)
        })
        .finally(() => {
          setPendingById(id, 'update', false)
        })
    },
    patch(id: Id, data: any, params: Params) {
      params = fastCopy(params) || {}

      // if (options.Model && (!params || !params.data)) {
      //   data = options.Model.diffOnPatch(data)
      // }
      if (params && params.data) {
        data = params.data
      }

      const {
        setPendingById,
        service,
        addOrUpdate
      } = this as unknown as ServiceStore

      setPendingById(id, 'patch', true)

      return service
        .patch(id, cleanData(data), params)
        .then((data: any) => {
          return addOrUpdate(data)
        })
        .catch((error: Error) => {
          // commit('setError', { method: 'update', error })
          return Promise.reject(error)
        })
        .finally(() => {
          setPendingById(id, 'patch', false)
        })
    },

    /**
     * Sends API request to remove the record with the given id. Calls `removeFromStore` after response.
     * @param id
     * @param params
     * @returns
     */
    remove(id: Id, params: Params = {}) {
      params = fastCopy(params)

      const {
        setPendingById,
        service,
        removeFromStore
      } = this as unknown as ServiceStore

      setPendingById(id, 'remove', true)

      return service
        .remove(id, params)
        .then((data: any) => {
          setPendingById(id, 'remove', false)
          removeFromStore(data)
          return data
        })
        .catch((error: Error) => {
          // commit('setError', { method: 'remove', error })
          setPendingById(id, 'remove', false)
          return Promise.reject(error)
        })
    },
    removeFromStore(data: any) {
      const { items, isArray } = getArray(data)
      const idsToRemove = items
        .map((item: any) => (getId(item) != null ? getId(item) : getTempId(item)))
        .filter((id: Id) => id != null)

      const {
        itemsById,
        clonesById,
        pendingById,
        tempsById
      } = this as unknown as ServiceStore

      (this as unknown as ServiceStore).itemsById = _.omit(itemsById, ...idsToRemove);
      (this as unknown as ServiceStore).ids = Object.keys(itemsById);

      (this as unknown as ServiceStore).clonesById = _.omit(clonesById, ...idsToRemove);
      (this as unknown as ServiceStore).pendingById = _.omit(pendingById, ...idsToRemove);
      (this as unknown as ServiceStore).tempsById = _.omit(tempsById, ...idsToRemove);

      return data
    },
    /**
     * An alias for addOrUpdate
     * @param data a single record or array of records.
     * @returns data added or modified in the store.  If you pass an array, you get an array back.
     */
    add(data: AnyData) {
      return (this as unknown as ServiceStore).addOrUpdate(data)
    },
    addOrUpdate(data: AnyData) {
      const { items, isArray } = getArray(data)
      const { 
        idField, 
        autoRemove,
        servicePath,
        tempsById,
        itemsById
      } = this as unknown as ServiceStore

      // Assure each item is an instance
      items.forEach((item: any, index: number) => {
        if (!(item instanceof options.Model)) {
          const classes = { [servicePath]: options.Model }
          items[index] = new classes[servicePath](item)
        }
      })

      // Move items with both __tempId and idField from tempsById to itemsById
      const withBoth = items.filter((i: any) => getId(i) != null && getTempId(i) != null)
      withBoth.forEach((item: any) => {
        const id = getId(item)
        const existingTemp = tempsById[item.__tempId]
        if (existingTemp) {
          this.itemsById[id] = existingTemp
          Object.assign(itemsById[id], item)
          delete tempsById[item.__tempId]
          delete itemsById[id].__tempId
        }
        delete item.__tempId
      })

      // Save items that have ids
      const withId = items.filter((i: any) => getId(i) != null)
      const itemsById = keyBy(withId)
      Object.assign(this.itemsById, itemsById)
      this.ids = Object.keys(this.itemsById)

      // Save temp items
      const temps = items.filter((i: any) => getId(i) == null).map((i: any) => assignTempId(i))
      const tempsById = keyBy(temps, (i: any) => i.__tempId)
      Object.assign(this.tempsById, tempsById)

      return isArray ? items : items[0]
    },

    clearAll() {
      (this as unknown as ServiceStore).ids = []
      (this as unknown as ServiceStore).itemsById = {}
      (this as unknown as ServiceStore).tempsById = {}
      (this as unknown as ServiceStore).clonesById = {}
    },

    clone(item: any, data = {}) {
      const placeToStore = item.__tempId != null ? 'tempsById' : 'itemsById'
      const id = getAnyId(item)

      const {
        clonesById,

      } = this as unknown as ServiceStore

      const originalItem = (this as unknown as ServiceStore)[placeToStore][id]
      const existing = clonesById[getAnyId(item)]
      if (existing) {
        const readyToReset = Object.assign(existing, originalItem, data)
        Object.keys(readyToReset).forEach((key) => {
          if (!Object.prototype.hasOwnProperty.call(originalItem, key)) {
            delete readyToReset[key]
          }
        })
        return readyToReset
      } else {
        const clone = fastCopy(originalItem)
        Object.defineProperty(clone, '__isClone', {
          value: true,
          enumerable: false,
        })
        Object.assign(clone, data)

        clonesById[id] = clone
        return clonesById[id] // Must return the item from the store
      }
    },
    commit(item: any) {
      const id = getAnyId(item)
      if (id != null) {
        const { 
          itemsById,
          clonesById
        } = this as unknown as ServiceStore
        const placeToStore = item.__tempId != null ? 'tempsById' : 'itemsById';
        (this as unknown as ServiceStore)[placeToStore][id] = fastCopy(clonesById[id])
        return itemsById[id]
      }
    },

    /**
     * Stores pagination data on state.pagination based on the query identifier
     * (qid) The qid must be manually assigned to `params.qid`
     */
    updatePaginationForQuery({ qid, response, query = {} }: UpdatePaginationForQueryOptions) {
      const { data, total } = response
      const { 
        idField,
        pagination
      } = this as unknown as ServiceStore
      const ids = data.map((i: any) => i[idField])
      const queriedAt = new Date().getTime()
      const { queryId, queryParams, pageId, pageParams } = getQueryInfo({ qid, query }, response)

      if (!this.pagination[qid]) {
        pagination[qid] = {}
      }
      if (
        !Object.prototype.hasOwnProperty.call(query, '$limit') && 
        Object.prototype.hasOwnProperty.call(response, 'limit')
      ) {
        pagination.defaultLimit = response.limit
      }
      if (
        !Object.prototype.hasOwnProperty.call(query, '$skip') && 
        Object.prototype.hasOwnProperty.call(response, 'skip')
      ) {
        pagination.defaultSkip = response.skip
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

      const qidData = pagination[qid] || {}
      Object.assign(qidData, { mostRecent })
      qidData[queryId] = qidData[queryId] || {}
      const queryData = {
        total,
        queryParams,
      }
      Object.assign(qidData[queryId], queryData)

      const pageData = {
        [pageId as string]: { pageParams, ids, queriedAt },
      }
      Object.assign(qidData[queryId], pageData)

      const newState = Object.assign({}, pagination[qid], qidData)

      pagination[qid] = newState
    },

    setPendingById(id: Id, method: RequestType, val: boolean) {
      //TODO @marshall: Why not just: `if (!id) { return; }`?
      const updatePendingState = (id: Id, method: RequestType) => {
        this.pendingById[id] = this.pendingById[id] || { [method]: val }
        this.pendingById[id][method] = val
      }
      if (id != null) {
        updatePendingState(id, method)
      }
    },
    hydrateAll() {
      const {
        add,
        items
      } = (this as unknown as ServiceStore);
      add(items)
    },
    toggleEventLock(idOrIds: Id | Id[], event: EventName) {
      setEventLockState(idOrIds, event, true, (this as unknown as ServiceStore))
    },
  }
}

// TODO @marshallswain: What's going on here? ` = true`? `val` unused?
function setEventLockState(
  data: Id | Id[], 
  event: EventName, 
  val: boolean, 
  store: Store<string, ServiceState, ServiceGetters, ServiceActions>
  ) {
  const { items: ids, isArray } = getArray(data)
  ids.forEach((id: Id) => {
    const currentLock = store.eventLocksById[event][id]
    if (currentLock) {
      delete store.eventLocksById[event][id]
    } else {
      store.eventLocksById[event][id] = true
    }
  })
}
