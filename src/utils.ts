import { Params, Paginated } from './types'
import { _ } from '@feathersjs/commons'
import stringify from 'fast-json-stable-stringify'
import fastCopy from 'fast-copy'
import _isObject from 'lodash/isObject'
import { models } from './models'
import { BaseModel } from './service-store/base-model';

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
  if (!item) {
    return
  }
  if ((idField && item[idField] != null) || item.hasOwnProperty(idField)) {
    return stringifyIfObject(item[idField as string])
  }
  if (item.id != null || item.hasOwnProperty('id')) {
    return stringifyIfObject(item.id)
  }
  if (item._id != null || item.hasOwnProperty('_id')) {
    return stringifyIfObject(item._id)
  }
}

export function getQueryInfo(
  params: Params = {},
  response: Partial<Pick<Paginated<any>, 'limit' | 'skip'>> = {}
) {
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
  }
}

export function mergeWithAccessors(
  dest: any,
  source: any,
  blacklist = ['__isClone', '__ob__']
) {
  const sourceProps = Object.getOwnPropertyNames(source)
  const destProps = Object.getOwnPropertyNames(dest)
  const sourceIsVueObservable = sourceProps.includes('__ob__')
  const destIsVueObservable = destProps.includes('__ob__')
  sourceProps.forEach(key => {
    const sourceDesc = Object.getOwnPropertyDescriptor(source, key) || null
    const destDesc = Object.getOwnPropertyDescriptor(dest, key)

    // if (Array.isArray(source[key]) && source[key].find(i => i.__ob__)) {
    //   sourceIsVueObservable = true
    // }
    // if (Array.isArray(dest[key]) && dest[key].find(i => i.__ob__)) {
    //   destIsVueObservable = true
    // }

    // This might have to be uncommented, but we'll try it this way, for now.
    // if (!sourceDesc.enumerable) {
    //   return
    // }

    // If the destination is not writable, return. Also ignore blacklisted keys.
    // Must explicitly check if writable is false
    if ((destDesc && destDesc.writable === false) || blacklist.includes(key)) {
      return
    }

    if (!sourceDesc) {
      return
    }

    // Handle Vue observable objects
    if (destIsVueObservable || sourceIsVueObservable) {
      const isObject = _isObject(source[key])
      const isFeathersPiniaInstance =
        isObject &&
        !!(
          source[key].constructor.modelName || source[key].constructor.namespace
        )
      // Do not use fastCopy directly on a feathers-vuex BaseModel instance to keep from breaking reactivity.
      if (isObject && !isFeathersPiniaInstance) {
        try {
          dest[key] = fastCopy(source[key])
        } catch (err) {
          if (!err.message.includes('getter')) {
            throw err
          }
        }
      } else {
        try {
          dest[key] = source[key]
        } catch (err) {
          if (!err.message.includes('getter')) {
            throw err
          }
        }
      }
      return
    }

    // Handle defining accessors
    if (
      sourceDesc && typeof sourceDesc.get === 'function' ||
      sourceDesc && typeof sourceDesc.set === 'function'
    ) {
      Object.defineProperty(dest, key, sourceDesc)
      return
    }

    // Do not attempt to overwrite a getter in the dest object
    if (destDesc && typeof destDesc.get === 'function') {
      return
    }

    // Assign values
    // Do not allow sharing of deeply-nested objects between instances
    // Potentially breaks accessors on nested data. Needs recursion if this is an issue
    let value
    if (_isObject(sourceDesc.value) && !isBaseModelInstance(sourceDesc.value)) {
      value = fastCopy(sourceDesc.value)
    }
    dest[key] = value || sourceDesc.value
  })
  return dest
}

export function isBaseModelInstance(item: BaseModel | {}) {
  const baseModels = Object.keys(models).map(alias => models[alias].BaseModel)
  return !!baseModels.find(BaseModel => {
    return item instanceof BaseModel
  })
}