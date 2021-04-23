import { Model, ServiceOptions, ServiceActions, UpdatePaginationForQueryOptions } from './types'
import { Params } from '../types'
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

export function makeActions(options: ServiceOptions): ServiceActions {
  return {
    ...(options.actions || {}),

    find(params: Params) {
      params = params || {}
      params: any = fastCopy(params)

      // For working with client-side services, paginate.default must be truthy.
      if (params.paginate === true) {
        params.paginate = { default: true }
      }

      this.setPendingById('Model', 'find', true)

      return this.service
        .find(params as any)
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
    async handleFindResponse({ params, response }: { params: Params; response: any }) {
      const { qid = 'default', query } = params

      this.addOrUpdate(response.data || response)

      // The pagination data will be under `pagination.default` or whatever qid is passed.
      response.data && this.updatePaginationForQuery({ qid, response, query })

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

      this.setPendingById('Model', 'count', true)

      return this.service.find(params as any).finally(() => {
        this.setPendingById('Model', 'count', false)
      })
    },

    // Supports passing params the feathers way: `get(id, params)`
    // Does NOT support the old array syntax: `get([null, params])` which was only needed for Vuex
    get(id: Id, params: Params = {}) {
      params = fastCopy(params)

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

    create(data: any, params: Params) {
      const { idField, tempIdField } = this
      params = fastCopy(params) || {}

      this.setPendingById(getId(data) || data[tempIdField], 'create', true)

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
          this.setPendingById(getId(data) || data[tempIdField], 'create', false)
        })
    },
    update(id: Id, data: any, params: Params) {
      params = fastCopy(params) || {}

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
    patch(id: Id, data: any, params: Params) {
      params = fastCopy(params) || {}

      // if (options.Model && (!params || !params.data)) {
      //   data = options.Model.diffOnPatch(data)
      // }
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
     * Sends API request to remove the record with the given id. Calls `removeFromStore` after response.
     * @param id
     * @param params
     * @returns
     */
    remove(id: Id, params: Params = {}) {
      params = fastCopy(params)

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
    removeFromStore(data: any) {
      const { items, isArray } = getArray(data)
      const idsToRemove = items
        .map((item: any) => (getId(item) != null ? getId(item) : getTempId(item)))
        .filter((id: any) => id != null)

      this.itemsById = _.omit(this.itemsById, ...idsToRemove)
      this.ids = Object.keys(this.itemsById)

      this.clonesById = _.omit(this.clonesById, ...idsToRemove)
      this.pendingById = _.omit(this.pendingById, ...idsToRemove)
      this.tempsById = _.omit(this.tempsById, ...idsToRemove)

      return data
    },
    /**
     * An alias for addOrUpdate
     * @param data a single record or array of records.
     * @returns data added or modified in the store.  If you pass an array, you get an array back.
     */
    add(data: AnyData) {
      return this.addOrUpdate(data)
    },
    addOrUpdate(data: AnyData) {
      const { items, isArray } = getArray(data)
      const { idField, autoRemove } = this

      // Assure each item is an instance
      items.forEach((item: any, index: number) => {
        if (!(item instanceof options.Model)) {
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
          delete this.itemsById[id].__tempId
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
      this.ids = []
      this.itemsById = {}
      this.tempsById = {}
      this.clonesById = {}
    },

    clone(item: any, data = {}) {
      const placeToStore = item.__tempId != null ? 'tempsById' : 'itemsById'
      const id = getAnyId(item)
      const originalItem = this[placeToStore][id]
      const existing = this.clonesById[getAnyId(item)]
      if (existing) {
        const readyToReset = Object.assign(existing, originalItem, data)
        Object.keys(readyToReset).forEach((key) => {
          if (!originalItem.hasOwnProperty(key)) {
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

        this.clonesById[id] = clone
        return this.clonesById[id] // Must return the item from the store
      }
    },
    commit(item: any) {
      const id = getAnyId(item)
      if (id != null) {
        const placeToStore = item.__tempId != null ? 'tempsById' : 'itemsById'
        this[placeToStore][id] = fastCopy(this.clonesById[id])
        return this.itemsById[id]
      }
    },

    /**
     * Stores pagination data on state.pagination based on the query identifier
     * (qid) The qid must be manually assigned to `params.qid`
     */
    updatePaginationForQuery({ qid, response, query = {} }: UpdatePaginationForQueryOptions) {
      const { data, total } = response
      const { idField } = this
      const ids = data.map((i: any) => i[idField])
      const queriedAt = new Date().getTime()
      const { queryId, queryParams, pageId, pageParams } = getQueryInfo({ qid, query }, response)

      if (!this.pagination[qid]) {
        this.pagination[qid] = {}
      }
      if (!query.hasOwnProperty('$limit') && response.hasOwnProperty('limit')) {
        this.pagination.defaultLimit = response.limit
      }
      if (!query.hasOwnProperty('$skip') && response.hasOwnProperty('skip')) {
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

      const qidData = this.pagination[qid] || {}
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

      const newState = Object.assign({}, this.pagination[qid], qidData)

      this.pagination[qid] = newState
    },

    setPendingById(id: string | number, method: RequestType, val: boolean) {
      const updatePendingState = (id: string | number, method: RequestType) => {
        this.pendingById[id] = this.pendingById[id] || ({ [method]: val } as any)
        this.pendingById[id][method] = val
      }
      if (id != null) {
        updatePendingState(id, method)
      }
    },
    hydrateAll() {
      this.add(this.items)
    },
    toggleEventLock(idOrIds: any, event: string) {
      setEventLockState(idOrIds, event, true, this)
    },
  }
}

function setEventLockState(data: any, event: string, val: boolean, store: any) {
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
