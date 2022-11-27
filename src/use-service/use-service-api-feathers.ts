import type { Id, NullableId, Service } from '@feathersjs/feathers'
import type { Ref } from 'vue'
import type { HandleFindResponseOptions } from '../service-store'
import type { Params } from '../types'
import type { MaybeRef } from '../utility-types'
import type { StorageMapUtils } from './use-service-storage'
import type { AnyData, AnyDataOrArray } from './types'
import { cleanData, getId, getQueryInfo, getSaveParams, hasOwn, restoreTempIds } from '../utils'

interface UseServiceFeathersOptions {
  service: Service
  idField: Ref<string>
  tempIdField: Ref<string>
  setPending?: any
  setPendingById?: any
  pagination: any
  itemStorage: StorageMapUtils
  updatePaginationForQuery: any
  unflagSsr: any
  getFromStore: any
  removeFromStore: any
  addToStore: any
  skipRequestIfExists: boolean
}

export const useServiceApiFeathers = (options: UseServiceFeathersOptions) => {
  const {
    service,
    idField,
    tempIdField,
    setPending,
    setPendingById,
    pagination,
    updatePaginationForQuery,
    unflagSsr,
    getFromStore,
    removeFromStore,
    addToStore,
    itemStorage,
    skipRequestIfExists,
  } = options

  async function find(_params?: MaybeRef<Params>) {
    const params = getSaveParams(_params)
    const { query = {} } = params
    const isPaginated = params.paginate === true || hasOwn(query, '$limit') || hasOwn(query, '$skip')

    // For client-side services, like feathers-memory, paginate.default must be truthy.
    if (isPaginated) {
      params.paginate = { default: true }
    }

    setPending('find', true)

    const info = getQueryInfo(params, {})
    const qidData = pagination.value[info.qid]
    const queryData = qidData?.[info.queryId]
    const pageData = queryData?.[info.pageId as string]

    let ssrPromise

    if (pageData?.ssr) {
      const ssrResponse = {
        data: pageData.ids.map((id: Id) => getFromStore.value(id)),
        limit: pageData.pageParams.$limit,
        skip: pageData.pageParams.$skip,
        total: queryData.total,
        fromSsr: true,
      }
      ssrPromise = Promise.resolve(ssrResponse)
      if (!params.preserveSsr) {
        unflagSsr(params)
      }
    }

    try {
      const response = await (ssrPromise || service.find(params))
      return await _handleFindResponse({ params, response })
    } catch (error) {
      return await Promise.reject(error)
    } finally {
      setPending('find', false)
    }
  }

  /**
   * Handle the response from the find action.
   *
   * @param payload consists of the following two params
   *   @param params - Remember that these params aren't what was sent to the
   *         Feathers client.  The client modifies the params object.
   *   @param response
   */
  async function _handleFindResponse({ params, response }: HandleFindResponseOptions) {
    const { qid = 'default', query, preserveSsr = false } = params
    // Normalize response so data is always found at response.data
    const paginated = Array.isArray(response) ? { data: response } : response

    addToStore(paginated.data)

    // The pagination data will be under `pagination.default` or whatever qid is passed.
    paginated.data && updatePaginationForQuery({ qid, response: paginated, query, preserveSsr })

    // Swap out the response records for their Vue-observable store versions
    const data = paginated.data
    const mappedFromState = data.map((item: Record<string, any>) => itemStorage.get(item))
    // const mappedFromState = data.map((item) => itemsById.value[getId(item, id) as Id])
    if (mappedFromState[0] !== undefined) {
      paginated.data = paginated.data = mappedFromState
    }

    return paginated
  }

  async function count(_params?: MaybeRef<Params>) {
    const params = getSaveParams(_params)
    const { query = {} } = params

    query.$limit = 0

    Object.assign(params, { query })

    setPending('count', true)

    try {
      return await service.find(params)
    } catch (error) {
      return await Promise.reject(error)
    } finally {
      setPending('count', false)
    }
  }

  // Supports passing params the feathers way: `get(id, params)`
  // Does NOT support the old array syntax:
  // `get([null, params])` which was only needed for Vuex
  async function get(id: Id, _params?: MaybeRef<Params>) {
    const params = getSaveParams(_params)

    const skipIfExists = params.skipRequestIfExists || skipRequestIfExists
    delete params.skipRequestIfExists

    // If the records is already in store, return it
    const existingItem = getFromStore.value(id, params)
    if (existingItem && skipIfExists) {
      return Promise.resolve(existingItem)
    }

    setPending('get', true)

    try {
      const response = await service.get(id, params)
      addToStore(response)
      return itemStorage.getItem(id)
    } catch (error) {
      return await Promise.reject(error)
    } finally {
      setPending('get', false)
    }
  }

  async function create(data: AnyData, _params?: MaybeRef<Params>): Promise<AnyData>
  async function create(data: AnyData[], _params?: MaybeRef<Params>): Promise<AnyData[]>
  async function create(data: AnyDataOrArray, _params?: MaybeRef<Params>): Promise<AnyDataOrArray> {
    const params = getSaveParams(_params)

    const _idField = idField.value
    const _tempIdField = tempIdField.value

    if (!Array.isArray(data)) {
      setPendingById(getId(data, _idField) || data[_tempIdField], 'create', true)
    }

    setPending('create', true)

    try {
      const response = await service.create(cleanData(data, _tempIdField), params)
      const restoredTempIds = restoreTempIds(data, response, _tempIdField)
      return addToStore(restoredTempIds)
    } catch (error) {
      return await Promise.reject(error)
    } finally {
      setPending('create', false)
      if (!Array.isArray(data)) {
        setPendingById(getId(data, _idField) || data[_tempIdField], 'create', false)
      }
    }
  }

  async function update(id: Id, data: AnyData, _params?: MaybeRef<Params>) {
    const params = getSaveParams(_params)

    setPendingById(id, 'update', true)
    setPending('update', true)

    try {
      const response = await service.update(id, cleanData(data, tempIdField.value), params)
      return addToStore(response)
    } catch (error) {
      return await Promise.reject(error)
    } finally {
      setPendingById(id, 'update', false)
      setPending('update', false)
    }
  }

  async function patch(id: Id, data: AnyData, _params?: MaybeRef<Params>): Promise<AnyData>
  async function patch(id: null, data: AnyData, _params?: MaybeRef<Params>): Promise<AnyData[]>
  async function patch(id: NullableId, data: AnyData, _params?: MaybeRef<Params>): Promise<AnyData | AnyData[]> {
    const params = getSaveParams(_params)

    if (params && params.data) {
      data = params.data
    }

    setPendingById(id, 'patch', true)
    setPending('patch', true)

    try {
      const response = await service.patch(id, cleanData(data, tempIdField.value), params)
      return addToStore(response)
    } catch (error) {
      return await Promise.reject(error)
    } finally {
      setPendingById(id, 'patch', false)
      setPending('patch', false)
    }
  }

  /**
   * Sends API request to remove the record with the given id.
   * Calls `removeFromStore` after response.
   * @param id
   * @param params
   * @returns
   */
  async function remove(id: Id, _params?: MaybeRef<Params>): Promise<AnyData>
  async function remove(id: null, _params?: MaybeRef<Params>): Promise<AnyData[]>
  async function remove(id: NullableId, _params?: MaybeRef<Params>): Promise<AnyData | AnyData[]> {
    const params = getSaveParams(_params)

    setPendingById(id, 'remove', true)
    setPending('remove', true)

    try {
      const response = await service.remove(id, params)
      removeFromStore(response)
      return response
    } catch (error) {
      return await Promise.reject(error)
    } finally {
      setPendingById(id, 'remove', false)
      setPending('remove', false)
    }
  }

  return { find, count, get, create, update, patch, remove }
}
