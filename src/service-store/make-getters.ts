import { Model, ServiceOptions, ServiceGetters, ServiceStore, ServiceState } from './types'
import { Params } from '../types'
import { Id } from '@feathersjs/feathers'

import sift from 'sift'
import { _ } from '@feathersjs/commons'
import { filterQuery, sorter, select } from '@feathersjs/adapter-commons'
import { unref } from 'vue'
import fastCopy from 'fast-copy'

const FILTERS = ['$sort', '$limit', '$skip', '$select']
const additionalOperators = ['$elemMatch']

export function makeGetters(
  options: ServiceOptions
): ServiceGetters {
  return {
    // Returns the Feathers service currently assigned to this store.
    service() {
      return options.clients[(this as unknown as ServiceStore).clientAlias].service((this as unknown as ServiceStore).servicePath)
    },
    items() {
      return Object.values((this as unknown as ServiceStore).itemsById)
    },
    temps() {
      return Object.values((this as unknown as ServiceStore).tempsById)
    },
    clones() {
      return Object.values((this as unknown as ServiceStore).clonesById)
    },
    findInStore() {
      return (params: Params) => {
        params = { ...unref(params) } || {}

        const { paramsForServer, whitelist, itemsById } = (this as unknown as ServiceStore)
        const q = _.omit(params.query || {}, paramsForServer)

        const { query, filters } = filterQuery(q, {
          operators: additionalOperators.concat(whitelist),
        })
        let values = _.values(itemsById)

        if (params.temps) {
          values.push(..._.values(this.tempsById))
        }

        values = values.filter(sift(query))

        const total = values.length

        if (filters.$sort) {
          values.sort(sorter(filters.$sort))
        }

        if (filters.$skip) {
          values = values.slice(filters.$skip)
        }

        if (typeof filters.$limit !== 'undefined') {
          values = values.slice(0, filters.$limit)
        }

        if (filters.$select) {
          values = values.map((value) => _.pick(value, ...filters.$select.slice()))
        }

        // Make sure items are instances
        values = values.map((item) => {
          if (item && !item.constructor.modelName) {
            item = (this as unknown as ServiceStore).addOrUpdate(item)
          }
          return item
        })

        return {
          total,
          limit: filters.$limit || 0,
          skip: filters.$skip || 0,
          data: values,
        }
      }
    },
    countInStore() {
      return (params: Params) => {
        params = { ...unref(params) } || {}

        if (!params.query) {
          throw 'params must contain a query-object'
        }

        params.query = _.omit(params.query, ...FILTERS)

        return (this as unknown as ServiceStore).findInStore(params).total
      }
    },
    getFromStore() {
      return (id: Id, params = {}) => {
        id = unref(id)
        params = fastCopy(unref(params) || {})
        const { Model } = options

        const { 
          itemsById, 
          idField, 
          addOrUpdate 
        } = (this as unknown as ServiceStore)

        let item = itemsById[id] && select(params, idField)(itemsById[id])

        // Make sure item is an instance
        if (item && !item.constructor.modelName) {
          item = addOrUpdate(item)
        }
        return item
      }
    },
    isCreatePending() {
      return makePending('create', (this as unknown as ServiceStore))
    },
    isPatchPending() {
      return makePending('patch', (this as unknown as ServiceStore))
    },
    isUpdatePending() {
      return makePending('update', (this as unknown as ServiceStore))
    },
    isRemovePending() {
      return makePending('remove', (this as unknown as ServiceStore))
    },
  }
}

function makePending(method: string, store: ServiceStore): boolean {
  const isPending = Object.keys(store.pendingById).reduce((isPending, key) => {
    return store.pendingById[key][method] || isPending
  }, false)
  return isPending
}
