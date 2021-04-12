import { Model, ServiceOptions, ServiceActions, UpdatePaginationForQueryOptions } from './types'
import { Params } from '../types'
import { RequestType } from './types'
import { Id, PaginationOptions } from '@feathersjs/feathers'
import { _ } from '@feathersjs/commons'
import fastCopy from 'fast-copy'
import { getId, getQueryInfo } from '../utils'

export function makeActions(options: ServiceOptions): ServiceActions {
  return {
    find(params: Params) {
      params = params || {}
      params = fastCopy(params)

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
      // dispatch('addOrUpdateList', response)

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

      this.setPendingById(getId(data) || data[tempIdField], 'get', true)

      return this.service
        .create(data, params)
        .then((data: any) => {
          return this.addOrUpdate(data)
        })
        .catch((error: Error) => {
          // commit('setError', { method: 'create', error })
          return Promise.reject(error)
        })
        .finally(() => {
          this.setPendingById(getId(data) || data[tempIdField], 'get', false)
        })
    },
    update(id: Id, data: any, params: Params) {
      this.setPendingById(id, 'update', true)

      params = fastCopy(params) || {}

      return this.service
        .update(id, data, params)
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
        .patch(id, data, params)
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

      // commit('setPending', 'remove')
      // commit('setIdPending', { method: 'remove', id })
      return this.service
        .remove(id, params)
        .then((data: any) => {
          this.removeFromStore(data)
          return data
        })
        .catch((error: Error) => {
          // commit('setError', { method: 'remove', error })
          return Promise.reject(error)
        })
        .finally(() => {
          // commit('unsetPending', 'remove')
          // commit('unsetIdPending', { method: 'remove', id })
        })
    },
    removeFromStore(data: any) {
      const items = Array.isArray(data) ? data : [data]
      const idsToRemove = items.map((item) => getId(item)).filter((id) => id != null)

      this.itemsById = _.omit(this.itemsById, ...idsToRemove)
      this.ids = Object.keys(this.itemsById)

      this.clonesById = _.omit(this.clonesById, ...idsToRemove)
      return data
    },
    addOrUpdate(data: any) {
      const items = Array.isArray(data) ? data : [data]
      const { idField, autoRemove } = this

      items.forEach((item, index) => {
        if (!(item instanceof options.Model)) {
          let { servicePath } = this
          let { Model } = options
          const classes = { [servicePath]: Model }
          items[index] = new classes[servicePath](item)
        }
      })

      const byId = items.reduce((all, current) => {
        const id = getId(current)
        all[id] = current
        return all
      }, {})

      Object.assign(this.itemsById, byId)
      this.ids = Object.keys(this.itemsById)

      return Array.isArray(data) ? items : items[0]
    },
    clearAll() {
      this.ids = []
      this.itemsById = {}
      this.clonesById = {}
    },
    clone(item: any, data = {}) {
      const originalItem = this.itemsById[getId(item)]
      const existing = this.clonesById[getId(item)]
      if (existing) {
        const readyToReset = Object.assign(existing, originalItem, data)
        Object.keys(readyToReset).forEach((key) => {
          if (!originalItem.hasOwnProperty(key)) {
            delete readyToReset[key]
          }
        })
        return readyToReset
      } else {
        this.clonesById[getId(item)] = fastCopy(originalItem)
        const clone = this.clonesById[getId(item)]
        Object.defineProperty(clone, '__isClone', {
          value: true,
          enumerable: false,
        })
        Object.assign(clone, data)
        return clone
      }
    },
    commit(item: any) {
      const id = getId(item)
      if (id != null) {
        this.itemsById[id] = fastCopy(this.clonesById[id])
        return this.itemsById[id]
      }
    },
    reset(item: any) {},

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
      const updatePendingState = (id: string | number) => {
        this.pendingById[id] = this.pendingById[id] || ({ [method]: val } as any)
        this.pendingById[id][method] = val
      }
      if (id != null) {
        updatePendingState(id)
      }
      // If updating pending instance state, also update the Model class's pending state.
      if (id !== 'Model') {
        updatePendingState('Model')
      }
    },
  }
}
