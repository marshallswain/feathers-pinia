import {
  ServiceOptions,
  ServiceActions,
  UpdatePaginationForQueryOptions,
  RequestType,
  AnyDataOrArray,
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
} from '../utils'
import { unref, set } from 'vue-demi'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface PaginationOptions {
  default: number
  max: number
}

export function makeActions(options: ServiceOptions): ServiceActions {
  return {
    find(requestParams: Params) {
      let params: any = unref(requestParams || {})
      params = fastCopy(params)
      const { query } = params
      const isPaginated =
        params.paginate === true || hasOwn(query, '$limit') || hasOwn(query, '$skip')

      // For client-side services, like feathers-memory, paginate.default must be truthy.
      if (isPaginated) {
        params.paginate = { default: true }
      }

      this.setPendingById('Model', 'find', true)

      const info = getQueryInfo(params, {})
      const qidData = this.pagination[info.qid]
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
    async handleFindResponse({ params, response }: { params: Params; response: any }) {
      const { qid = 'default', query, preserveSsr } = params

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
    handleFindError({ error }: { params: Params; error: any }) {
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
    // Does NOT support the old array syntax:
    // `get([null, params])` which was only needed for Vuex
    get(id: Id, params: Params = {}) {
      params = fastCopy(unref(params))

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

    create(data: AnyDataOrArray, params: Params) {
      const { tempIdField } = this
      params = fastCopy(unref(params || {}))

      if (!Array.isArray(data)) {
        this.setPendingById(getId(data) || data[tempIdField], 'create', true)
      }

      return this.service
        .create(cleanData(data, this.tempIdField), params)
        .then((response: any) => {
          return this.addOrUpdate(restoreTempIds(data, response, this.tempIdField))
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
    update(id: Id, data: any, params: Params) {
      params = fastCopy(unref(params || {}))

      this.setPendingById(id, 'update', true)

      return this.service
        .update(id, cleanData(data, this.tempIdField), params)
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
    patch(id: NullableId, data: any, params: Params) {
      params = fastCopy(unref(params || {}))

      if (params && params.data) {
        data = params.data
      }
      this.setPendingById(id, 'patch', true)

      return this.service
        .patch(id, cleanData(data, this.tempIdField), params)
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
    remove(id: NullableId, params: Params = {}) {
      params = fastCopy(unref(params || {}))

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
    removeFromStore(data: AnyDataOrArray) {
      const { items } = getArray(data)
      const idsToRemove = items
        .map((item: any) => (getId(item) != null ? getId(item) : getTempId(item, this.tempIdField)))
        .filter((id: any) => id != null)

      set(this, 'itemsById', _.omit(this.itemsById, ...idsToRemove))

      set(this, 'clonesById', _.omit(this.clonesById, ...idsToRemove))
      set(this, 'pendingById', _.omit(this.pendingById, ...idsToRemove))
      set(this, 'tempsById', _.omit(this.tempsById, ...idsToRemove))

      return data
    },
    /**
     * An alias for addOrUpdate
     * @param data a single record or array of records.
     * @returns data added or modified in the store.
     *  If you pass an array, you get an array back.
     */
    addToStore(data: AnyDataOrArray) {
      return this.addOrUpdate(data)
    },
    addOrUpdate(data: AnyDataOrArray) {
      const { items, isArray } = getArray(data)

      // Assure each item is an instance
      items.forEach((item: any, index: number) => {
        if (this.isSsr || !(item instanceof options.Model)) {
          const classes = { [this.servicePath]: options.Model }
          set(items, index, new classes[this.servicePath](item))
        }
      })

      const { tempIdField } = this

      // Move items with both tempIdField and idField from tempsById to itemsById
      const withBoth = items.filter(
        (i: any) => getId(i) != null && getTempId(i, tempIdField) != null,
      )
      withBoth.forEach((item: any) => {
        const id = getId(item)
        const tempId = getTempId(item, tempIdField)
        const existingTemp = this.tempsById[tempId]
        if (existingTemp) {
          set(this.itemsById, id, existingTemp)
          set(this.itemsById, id, Object.assign({}, this.itemsById[id], item))
          delete this.tempsById[tempId]
          delete this.itemsById[id][tempId]
        }
        delete item[tempIdField]
      })

      // Save items that have ids
      const withId = items.filter((i: any) => getId(i) != null)
      const itemsById = keyBy(withId)
      set(this, 'itemsById', Object.assign({}, this.itemsById, itemsById))

      // Save temp items
      const temps = items
        .filter((i: any) => getId(i) == null)
        .map((i: any) => assignTempId(i, tempIdField))
      const tempsById = keyBy(temps, (i: any) => i[tempIdField])
      set(this, 'tempsById', Object.assign({}, this.tempsById, tempsById))

      return isArray ? items : items[0]
    },

    clearAll() {
      set(this, 'itemsById', {})
      set(this, 'tempsById', {})
      set(this, 'clonesById', {})
    },

    clone(item: any, data = {}) {
      const tempId = getTempId(item, this.tempIdField)
      const placeToStore = tempId != null ? 'tempsById' : 'itemsById'
      const id = getAnyId(item, this.tempIdField)
      const originalItem = this[placeToStore][id]
      const existing = this.clonesById[id]
      if (existing && existing.constructor.name === originalItem.constructor.name) {
        const readyToReset = Object.assign(existing, originalItem, data)
        Object.keys(readyToReset).forEach((key) => {
          if (!hasOwn(originalItem, key)) {
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

        set(this.clonesById, id, clone)
        return this.clonesById[id] // Must return the item from the store
      }
    },
    commit(item: any) {
      const id = getAnyId(item, this.tempIdField)
      if (id != null) {
        const tempId = getTempId(item, this.tempIdField)
        const placeToStore = tempId != null ? 'tempsById' : 'itemsById'
        set(this[placeToStore], id, fastCopy(this.clonesById[id]))
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
        set(this.pagination, qid, {})
      }

      if (!hasOwn(query, '$limit') && hasOwn(response, 'limit')) {
        set(this.pagination, 'defaultLimit', response.limit)
      }
      if (!hasOwn(query, '$skip') && hasOwn(response, 'skip')) {
        set(this.pagination, 'defaultSkip', response.skip)
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

      const existingPageData = this.pagination[qid]?.[queryId]?.[pageId as string]

      const qidData = this.pagination[qid] || {}
      Object.assign(qidData, { mostRecent })
      set(qidData, queryId, qidData[queryId] || {})
      const queryData = {
        total,
        queryParams,
      }
      set(qidData, queryId, Object.assign({}, qidData[queryId], queryData))

      const ssr = preserveSsr ? existingPageData?.ssr : unref(options.ssr)

      const pageData = {
        [pageId as string]: { pageParams, ids, queriedAt, ssr: !!ssr },
      }
      Object.assign(qidData[queryId], pageData)

      const newState = Object.assign({}, this.pagination[qid], qidData)

      set(this.pagination, qid, newState)
    },

    setPendingById(id: string | number, method: RequestType, val: boolean) {
      const updatePendingState = (id: string | number, method: RequestType) => {
        set(this.pendingById, id, this.pendingById[id] || ({ [method]: val } as any))
        set(this.pendingById[id], method, val)
      }
      if (id != null) {
        updatePendingState(id, method)
      }
    },
    hydrateAll() {
      this.addToStore(this.items)
    },
    toggleEventLock(idOrIds: any, event: string) {
      setEventLockState(idOrIds, event, true, this)
    },
    unflagSsr(params: Params) {
      const queryInfo = getQueryInfo(params, {})
      const { qid, queryId, pageId } = queryInfo
      const pageData = this.pagination[qid]?.[queryId]?.[pageId as string]
      pageData.ssr = false
    },
    ...options.actions,
  }
}

function setEventLockState(data: any, event: string, val: boolean, store: any) {
  const { items: ids } = getArray(data)
  ids.forEach((id: Id) => {
    const currentLock = store.eventLocksById[event][id]
    if (currentLock) {
      delete store.eventLocksById[event][id]
    } else {
      set(store.eventLocksById[event], id, true)
    }
  })
}
