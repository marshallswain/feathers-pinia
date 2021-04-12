import { Model, ServiceOptions, ServiceActions, UpdatePaginationForQueryOptions } from './types'
import { Params } from '../types'
import { Id, PaginationOptions } from '@feathersjs/feathers'
import { _ } from '@feathersjs/commons'
import fastCopy from 'fast-copy'
import { getId, getQueryInfo } from '../utils'

export function makeActions(options: ServiceOptions): ServiceActions {
  return {
    find(params: Params) {
      params = params || {}
      params = fastCopy(params)

      const service = options.clients[this.clientAlias].service(this.servicePath)

      // commit('setPending', 'find')

      return service
        .find(params as any)
        .then((response: any) => this.handleFindResponse({ params, response }))
        .catch((error: any) => this.handleFindError({ params, error }))
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
      // commit('unsetPending', 'find')

      // The pagination data will be under `pagination.default` or whatever qid is passed.
      response.data && this.updatePaginationForQuery({ qid, response, query })

      // Swap out the response records for their Vue-observable store versions
      const data = response.data || response
      const mappedFromState = data.map((i: any) => this.keyedById[getId(i)])
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
      //  commit('unsetPending', 'find')
      return Promise.reject(error)
    },

    // Supports passing params the feathers way: `get(id, params)`
    // Does NOT support the old array syntax: `get([null, params])` which was only needed for Vuex
    get(id: Id, params: Params) {
      params = fastCopy(params)

      const skipRequestIfExists = params.skipRequestIfExists || this.skipRequestIfExists
      delete params.skipRequestIfExists

      // If the records is already in store, return it
      const existingItem = this.getFromStore(id, params)
      if (existingItem && skipRequestIfExists) {
        return Promise.resolve(existingItem)
      }

      const service = options.clients[this.clientAlias].service(this.servicePath)

      // commit('setPending', 'get')
      return service
        .get(id, params)
        .then((data: any) => {
          this.addOrUpdate(data)
          // dispatch('addOrUpdate', item)
          // commit('unsetPending', 'get')
          return this.keyedById[id]
        })
        .catch((error: Error) => {
          // commit('setError', { method: 'get', error })
          // commit('unsetPending', 'get')
          return Promise.reject(error)
        })
    },

    create(data: any, params: Params) {
      const { idField, tempIdField } = this
      params = fastCopy(params) || {}

      // commit('setPending', 'create')
      // commit('setIdPending', { method: 'create', id: tempIds })
      const service = options.clients[this.clientAlias].service(this.servicePath)

      return service
        .create(data, params)
        .then((data: any) => {
          return this.addOrUpdate(data)
        })
        .catch((error: Error) => {
          // commit('setError', { method: 'create', error })
          return Promise.reject(error)
        })
        .finally(() => {
          // commit('unsetPending', 'create')
          // commit('unsetIdPending', { method: 'create', id: tempIds })
        })
    },
    update(id: Id, data: any, params: Params) {
      // commit('setPending', 'update')
      // commit('setIdPending', { method: 'update', id })

      params = fastCopy(params) || {}

      const service = options.clients[this.clientAlias].service(this.servicePath)

      return service
        .update(id, data, params)
        .then((data: any) => {
          return this.addOrUpdate(data)
        })
        .catch((error: Error) => {
          // commit('setError', { method: 'update', error })
          return Promise.reject(error)
        })
        .finally(() => {
          // commit('unsetPending', 'update')
          // commit('unsetIdPending', { method: 'update', id })
        })
    },
    patch(id: Id, data: any, params: Params) {
      // commit('setPending', 'update')
      // commit('setIdPending', { method: 'update', id })

      params = fastCopy(params) || {}

      // if (options.Model && (!params || !params.data)) {
      //   data = options.Model.diffOnPatch(data)
      // }
      if (params && params.data) {
        data = params.data
      }
      const service = options.clients[this.clientAlias].service(this.servicePath)

      return service
        .patch(id, data, params)
        .then((data: any) => {
          return this.addOrUpdate(data)
        })
        .catch((error: Error) => {
          // commit('setError', { method: 'update', error })
          return Promise.reject(error)
        })
        .finally(() => {
          // commit('unsetPending', 'update')
          // commit('unsetIdPending', { method: 'update', id })
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
      const service = options.clients[this.clientAlias].service(this.servicePath)

      return service
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

      this.keyedById = _.omit(this.keyedById, ...idsToRemove)
      this.ids = Object.keys(this.keyedById)

      this.copiesById = _.omit(this.copiesById, ...idsToRemove)
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

      Object.assign(this.keyedById, byId)
      this.ids = Object.keys(this.keyedById)

      return Array.isArray(data) ? items : items[0]
    },
    clearAll() {
      this.ids = []
      this.keyedById = {}
      this.copiesById = {}
    },
    copy(item: any) {
      this.copiesById = fastCopy(item)
      return this.copiesById[getId(item)]
    },
    commitCopy(item: any) {
      const id = getId(item)
      if (id != null) {
        this.keyedById[id] = fastCopy(this.copiesById[id])
        return this.keyedById[id]
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
  }
}
