import { ServiceOptions, ServiceGetters } from './types'
import { Params } from '../types'
import { Id } from '@feathersjs/feathers'

import sift from 'sift'
import { _ } from '@feathersjs/commons'
import { filterQuery, sorter, select } from '@feathersjs/adapter-commons'
import { unref } from 'vue-demi'
import fastCopy from 'fast-copy'
import { getId } from '../utils'

const FILTERS = ['$sort', '$limit', '$skip', '$select']
const additionalOperators = ['$elemMatch']

export function makeGetters(options: ServiceOptions): ServiceGetters {
  return {
    // Returns the Feathers service currently assigned to this store.
    service() {
      const client = options.clients[this.clientAlias || options.clientAlias]
      if (!client) {
        throw new Error(
          `There is no registered FeathersClient named '${this.clientAlias}'. You need to provide one in the 'defineStore' options.`,
        )
      }
      return client.service(this.servicePath)
    },
    Model() {
      return options.Model
    },
    isSsr() {
      const ssr = unref(options.ssr)
      return !!ssr
    },
    itemIds() {
      return Object.keys(this.itemsById)
    },
    items() {
      return Object.values(this.itemsById)
    },
    tempIds() {
      return Object.keys(this.tempsById)
    },
    temps() {
      return Object.values(this.tempsById)
    },
    cloneIds() {
      return Object.keys(this.clonesById)
    },
    clones() {
      return Object.values(this.clonesById)
    },
    itemsAndTemps() {
      return this.items.concat(this.temps);
    },
    itemsAndClones() {
      return this.items.map((item: any) => {
        const id = getId(item, this.idField)
        return this.clonesById[id] || item
      });
    },
    itemsTempsAndClones() {
      return this.itemsAndTemps.map((item: any) => {
        const id = getId(item, this.idField)

        return (id != null && this.clonesById[id]) || 
               (item.__tempId != null && this.clonesById[item.__tempId]) ||
               item;
      })
    },
    operators() {
      return additionalOperators
        .concat(this.whitelist)
        .concat(this.service.options?.allow || this.service.options?.whitelist || [])
    },
    findInStore() {
      return (params: Params) => {
        params = { ...unref(params) } || {}

        const q = _.omit(params.query || {}, this.paramsForServer)

        const { query, filters } = filterQuery(q, { operators: this.operators })

        let values: any[]
        if (!params.temps && !params.clones) {
          values = this.items
        } else if (params.temps && !params.clones) {
          values = this.itemsAndTemps
        } else if (!params.temps && params.clones) {
          values = this.itemsAndClones
        } else {
          values = this.itemsTempsAndClones
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

        // keep transformed items by $select separately
        // so `addOrUpdate` can transform the original item to an instance
        // otherwise the picked Values would go through `addOrUpdate` every time
        let pickedValues: any[] | undefined = undefined;
        if (filters.$select) {
          pickedValues = values.map((value) => _.pick(value, ...filters.$select))
        }

        // Make sure items are instances
        values = values.map((item) => {
          if (item && !item.constructor.modelName) {
            item = this.addOrUpdate(item)
          }
          return item
        })

        return {
          total,
          limit: filters.$limit || 0,
          skip: filters.$skip || 0,
          data: pickedValues || values,
        }
      }
    },
    countInStore() {
      return (params: Params) => {
        params = { ...unref(params) }

        if (!params.query) {
          throw 'params must contain a query-object'
        }

        params.query = _.omit(params.query, ...FILTERS)

        return this.findInStore(params).total
      }
    },
    getFromStore() {
      return (id: Id, params: Params = {}) => {
        id = unref(id)
        params = fastCopy(unref(params) || {})

        let item
        if (params.clones) {
          item = this.clonesById[id] && select(params, this.idField)(this.clonesById[id])
        }
        if (!item) item = this.itemsById[id] && select(params, this.idField)(this.itemsById[id])
        if (!item) item = this.tempsById[id] && select(params, '__tempId')(this.tempsById[id])

        // Make sure item is an instance
        if (item && !item.constructor.modelName) {
          item = this.addOrUpdate(item)
        }
        return item
      }
    },
    isCreatePending() {
      return makePending('create', this)
    },
    isPatchPending() {
      return makePending('patch', this)
    },
    isUpdatePending() {
      return makePending('update', this)
    },
    isRemovePending() {
      return makePending('remove', this)
    },
    ...options.getters,
  }
}

function makePending(method: string, store: any): boolean {
  const isPending = Object.keys(store.pendingById).reduce((isPending, key) => {
    return store.pendingById[key][method] || isPending
  }, false)
  return isPending
}
