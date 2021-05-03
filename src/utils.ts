import { Params, Paginated, QueryInfo } from './types'
import { _ } from '@feathersjs/commons'
import stringify from 'fast-json-stable-stringify'
import ObjectID from 'bson-objectid'
import { Id } from '@feathersjs/feathers'

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
  // TODO: why 'hasOwnProperty' at all?
  if ((idField && item[idField] != null) || item.hasOwnProperty(idField)) {
    return stringifyIfObject(item[idField as string])
  }
  // TODO: why 'hasOwnProperty' at all?
  if (item.id != null || item.hasOwnProperty('id')) {
    return stringifyIfObject(item.id)
  }
  // TODO: why 'hasOwnProperty' at all?
  if (item._id != null || item.hasOwnProperty('_id')) {
    return stringifyIfObject(item._id)
  }
}
export function getTempId(item: any) {
  // TODO: why 'hasOwnProperty' at all?
  if (item?.__tempId != null || item?.hasOwnProperty('__tempId')) {
    return stringifyIfObject(item.__tempId)
  }
}
export function getAnyId(item: any) {
  const id = getId(item)
  return id != null ? id : getTempId(item)
}

export function getQueryInfo(
  params: Params = {},
  response: Partial<Pick<Paginated<any>, 'limit' | 'skip'>> = {}
): QueryInfo {
  const query = params.query || {}
  const qid: string = params.qid || 'default'
  const $limit =
    response.limit !== null && response.limit !== undefined ? response.limit : query.$limit
  const $skip = response.skip !== null && response.skip !== undefined ? response.skip : query.$skip

  const queryParams = _.omit(query, ...['$limit', '$skip'])
  const queryId = stringify(queryParams)
  const pageParams = $limit !== undefined ? { $limit, $skip } : undefined
  const pageId = pageParams ? stringify(pageParams) : undefined

  return {
    qid,
    query,
    queryId,
    queryParams,
    pageParams,
    pageId,
    response: undefined,
    isOutdated: undefined as boolean | undefined,
  } as QueryInfo
}

export function getItemsFromQueryInfo(
  pagination: any, 
  queryInfo: QueryInfo, 
  keyedById: any
  ) {
  const { queryId, pageId } = queryInfo
  const queryLevel = pagination[queryId]
  const pageLevel = queryLevel && queryLevel[pageId]
  const ids = pageLevel && pageLevel.ids

  if (ids && ids.length) {
    return ids.map((id: Id) => keyedById[id])
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
export function assignTempId(item: any) {
  const newId = new ObjectID().toHexString()
  item.__tempId = newId
  return item
}
