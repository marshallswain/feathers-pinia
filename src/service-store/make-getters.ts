import { Model, ServiceOptions, ServiceGetters } from './types'
import { Params } from '../types'
import { Id } from '@feathersjs/feathers'

import sift from 'sift'
import { _ } from '@feathersjs/commons'
import { filterQuery, sorter, select } from '@feathersjs/adapter-commons'
import { unref } from 'vue'

const FILTERS = ['$sort', '$limit', '$skip', '$select']
const additionalOperators = ['$elemMatch']

export function makeGetters(options: ServiceOptions): ServiceGetters {
  return {
    // Returns the Feathers service currently assigned to this store.
    service() {
      return options.clients[this.clientAlias].service(this.servicePath)
    },
    listInStore() {
      return (this.ids as Array<unknown>).map((id) => (this.itemsById as any)[id as string])
    },
    findInStore() {
      return (params: Params) => {
        params = { ...unref(params) } || {}

        const { paramsForServer, whitelist, itemsById } = this
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

        /**
         * Many are of the opinion that having a mutation inside of a getter is a big "no no", It usually is;
         * however, this allows SSR apps and vuex-persist apps to just work without extra boilerplate, and it's
         * very fast compared to other hydration options.  This enables seamless, lazy hydration to work.
         */
        // values = values.map(item => {
        //   const isInstance =
        //     (!!model && item instanceof model) || (item.constructor && !!item.constructor.idField)
        //   if (model && !isInstance) {
        //     item = new model(item, { skipStore: true })
        //     model.replaceItem(item)
        //   }
        //   return item
        // })

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

        return this.findInStore(params).total
      }
    },
    getFromStore() {
      return (id: Id, params = {}) => {
        id = unref(id)
        params = { ...unref(params) } || {}
        const { Model } = options

        let item = this.itemsById[id] && select(params, this.idField)(this.itemsById[id])

        // Make sure item is an instance
        if (item && !!item.constructor.modelName) {
          item = this.addOrUpdate(item)
        }
        return item
      }
    },
  }
}
