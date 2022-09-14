import { Params, Paginated, QueryInfo } from './types'
import { _ } from '@feathersjs/commons'
import stringify from 'fast-json-stable-stringify'
import ObjectID from 'bson-objectid'
import { Id } from '@feathersjs/feathers'
import fastCopy from 'fast-copy'
import { AnyData, AnyDataOrArray } from './service-store/types'
import { unref } from 'vue-demi'
import { MaybeRef } from './utility-types'

function stringifyIfObject(val: any): string | any {
  if (typeof val === 'object' && val != null) {
    return val.toString()
  }
  return val
}

/**
 * Get the id from a record in this order:
 *   1. the `idField`
 *   2. id
 *   3. _id
 * @param item
 * @param idField
 */
export function getId(item: any, idField?: string) {
  if (!item) return
  if (idField && item[idField] != undefined) {
    return stringifyIfObject(item[idField as string])
  }
  if (item.id != undefined) {
    return stringifyIfObject(item.id)
  }
  if (item._id != undefined) {
    return stringifyIfObject(item._id)
  }
}
export function getTempId(item: any, tempIdField: string) {
  if (item?.[tempIdField] != undefined) {
    return stringifyIfObject(item[tempIdField])
  }
}
export function getAnyId(item: any, tempIdField: string) {
  return getId(item) != undefined ? getId(item) : getTempId(item, tempIdField)
}

export function getQueryInfo(
  params: Params = {},
  response: Partial<Pick<Paginated<any>, 'limit' | 'skip'>> = {},
): QueryInfo {
  const { query = {}, qid = 'default' } = params
  const $limit = response.limit != undefined ? response.limit : query?.$limit
  const $skip = response.skip != undefined ? response.skip : query?.$skip

  const pageParams = $limit !== undefined ? { $limit, $skip } : undefined
  const pageId = pageParams ? stringify(pageParams) : undefined

  const queryParams = _.omit(query, '$limit', '$skip')
  const queryId = stringify(queryParams)

  return {
    qid,
    query,
    queryId,
    queryParams,
    pageParams,
    pageId,
    response: undefined,
    isOutdated: undefined as boolean | undefined,
  }
}

export function getItemsFromQueryInfo(pagination: any, queryInfo: any, keyedById: any): any[] {
  const { queryId, pageId } = queryInfo
  const queryLevel = pagination[queryId]
  const pageLevel = queryLevel && queryLevel[pageId]
  const ids = pageLevel && pageLevel.ids

  if (ids && ids.length) {
    return Object.values(_.pick(keyedById, ...ids))
  } else {
    return []
  }
}

export function keyBy(items: any, fn: Function = (i: any) => getId(i)) {
  return items.reduce((all: any, current: any) => {
    const id = fn(current)
    all[id] = current
    return all
  }, {})
}

/**
 * Generate a new tempId and mark the record as a temp
 * @param state
 * @param item
 */
export function assignTempId(item: any, tempIdField: string) {
  const newId = new ObjectID().toHexString()
  item[tempIdField] = newId
  return item
}

/**
 * Cleans data to prepare it for the server.
 * @param data item or array of items
 * @returns items without private attributes like __isClone and __tempId
 */
export function cleanData<T = AnyDataOrArray>(data: T, tempIdField: string): T {
  const { items, isArray } = getArray(data)
  const cleaned = items.map((item) => _.omit(item, '__isClone', tempIdField))

  return isArray ? cleaned : cleaned[0]
}

/**
 * Restores tempIds to the records returned from the server. The tempIds need to be
 * temporarily put back in place in order to migrate the objects from the tempsById
 * into the itemsById. A shallow copy of the object
 *
 * Note when data is an array, it doesn't matter if the server
 * returns the items in the same order. It's only important that all of the correct
 * records are moved from tempsById to itemsById
 *
 * @param data item(s) before being passed to the server
 * @param responseData items(s) returned from the server
 */
export function restoreTempIds(data: AnyDataOrArray, resData: AnyDataOrArray, tempIdField: string) {
  const { items: sourceItems, isArray } = getArray(data)
  const { items: responseItems } = getArray(resData)

  responseItems.forEach((item: any, index: number) => {
    const tempId = sourceItems[index][tempIdField]
    if (tempId) {
      item[tempIdField] = tempId
    }
  })

  return isArray ? responseItems : responseItems[0]
}

/**
 * Uses fast-copy on any data provided get an independent and reference-free copy.
 * This makes it easy to work with client-side databases like feathers-memory. It makes
 * it impossible to accidentally modify stored data due to js object in-memory references.
 * @param data item or array of items
 */
export function useCleanData(data: any) {
  const { items, isArray } = getArray(data)
  const cleaned = items.map((item: any) => fastCopy(item))

  return isArray ? cleaned : cleaned[0]
}

/**
 *
 * @param data item or array of items
 * @returns object with { items[], isArray } where isArray is a boolean of if the data was an array.
 */
export function getArray<T>(data: T | T[]) {
  const isArray = Array.isArray(data)
  return { items: isArray ? data : [data], isArray }
}

export const hasOwn = (obj: AnyData, prop: string) => Object.prototype.hasOwnProperty.call(obj, prop)

export function getSaveParams(params?: MaybeRef<Params>): Params {
  if (!params) {
    return {}
  }
  return fastCopy(unref(params))
}
export function markAsClone<T>(item: T) {
  Object.defineProperty(item, '__isClone', {
    value: true,
    enumerable: false,
  })
  return item
}
