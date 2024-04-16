import type { MaybeRef } from '@vueuse/core'
import type { Ref } from 'vue-demi'
import { _ } from '@feathersjs/commons'
import { unref } from 'vue-demi'
import isEqual from 'fast-deep-equal'
import fastCopy from 'fast-copy'
import type { AnyData, AnyDataOrArray, DiffDefinition, Params, Query, QueryInfo } from '../types.js'
import { defineValues } from './define-properties.js'
import { convertData } from './convert-data.js'

// copied from @feathersjs/commons
export function createSymbol(name: string) {
  return typeof Symbol !== 'undefined' ? Symbol.for(name) : name
}

export const SERVICE = createSymbol('@feathersjs/service')

interface GetExtendedQueryInfoOptions {
  queryInfo: QueryInfo
  service: any
  store: any
  qid: Ref<string>
}
export function getExtendedQueryInfo({ queryInfo, service, store, qid }: GetExtendedQueryInfoOptions) {
  const qidState: any = store.pagination[qid.value]
  const queryState = qidState[queryInfo.queryId]
  if (!queryState)
    return null

  const { total } = queryState
  const pageState = queryState[queryInfo.pageId as string]
  if (!pageState)
    return null

  const { ids, queriedAt, ssr } = pageState
  const result = ids.map((id: any) => store.itemsById[id]).filter((i: any) => i)
  const items = convertData(service, result)
  const info = { ...queryInfo, ids, items, total, queriedAt, queryState, ssr }
  return info || null
}

export function hasOwn(obj: AnyData, prop: string) {
  return Object.prototype.hasOwnProperty.call(obj, prop)
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

export function pickDiff(obj: any, diffDef: DiffDefinition) {
  // If no diff definition was given, return the entire object.
  if (!diffDef)
    return obj

  // Normalize all types into an array and pick the keys
  const keys = typeof diffDef === 'string' ? [diffDef] : Array.isArray(diffDef) ? diffDef : Object.keys(diffDef || obj)
  const topLevelKeys = keys.map(key => key.toString().split('.')[0])
  return _.pick(obj, ...topLevelKeys)
}

export function diff(dest: AnyData, source: AnyData, diffDef?: DiffDefinition) {
  const originalVal = pickDiff(dest, diffDef)
  const cloneVal = pickDiff(source, diffDef)

  // If diff was an object, merge the values into the cloneVal
  if (typeof diffDef !== 'string' && !Array.isArray(diffDef))
    Object.assign(cloneVal, diffDef)

  const areEqual = isEqual(originalVal, cloneVal)

  if (areEqual)
    return {}

  // Loop through clone, compare original value to clone value, if different add to diff object.
  const diff = Object.keys(cloneVal).reduce((diff: AnyData, key) => {
    if (!isEqual(dest[key], cloneVal[key]))
      diff[key] = cloneVal[key]

    return diff
  }, {})

  return diff
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
export function restoreTempIds(data: AnyDataOrArray<any>, resData: AnyDataOrArray<any>, tempIdField = '__tempId') {
  const { items: sourceItems, isArray } = getArray(data)
  const { items: responseItems } = getArray(resData)

  responseItems.forEach((item: any, index: number) => {
    const tempId = sourceItems[index][tempIdField]
    if (tempId)
      defineValues(item, { [tempIdField]: tempId })
  })

  return isArray ? responseItems : responseItems[0]
}

function stringifyIfObject(val: any): string | any {
  if (typeof val === 'object' && val != null)
    return val.toString()

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
export function getId(item: any, idField: string) {
  if (!item)
    return
  if (idField && item[idField] !== undefined)
    return stringifyIfObject(item[idField as string])

  if (item.id !== undefined)
    return stringifyIfObject(item.id)

  if (item._id !== undefined)
    return stringifyIfObject(item._id)
}

/**
 * Assures params exist.
 * @param params existing params
 */
export function getParams(params?: MaybeRef<Params<Query>>): Params<Query> {
  if (!params)
    return {}

  return fastCopy(unref(params))
}

export function timeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
