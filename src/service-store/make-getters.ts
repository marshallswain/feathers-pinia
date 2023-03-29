import type { MakeServiceGettersOptions, ServiceStoreDefaultGetters, ServiceStoreDefaultState } from './types'
import type { Params } from '../types'
import type { Id } from '@feathersjs/feathers'
import type { StateTree, _GettersTree } from 'pinia'
import type { TypedGetters } from '../utility-types'
import sift from 'sift'
import { operations } from '../utils-custom-operators'
import { _ } from '@feathersjs/commons'
import { filterQuery, sorter, select } from '@feathersjs/adapter-commons'
import { unref } from 'vue-demi'
import fastCopy from 'fast-copy'
import { BaseModel } from './base-model'

const FILTERS = ['$sort', '$limit', '$skip', '$select']
const additionalOperators = ['$elemMatch']

type ServiceStoreTypedGetters<M extends BaseModel = BaseModel> = TypedGetters<
  ServiceStoreDefaultState<M>,
  ServiceStoreDefaultGetters<M>
>

export function makeGetters<M extends BaseModel = BaseModel, S extends StateTree = {}, G extends _GettersTree<S> = {}>(
  options: MakeServiceGettersOptions<M, S, G>,
): ServiceStoreDefaultGetters<M> & G {
  const defaultGetters: ServiceStoreTypedGetters<M> = {
    // Returns the Feathers service currently assigned to this store.
    service() {
      const client = options.clients[this.clientAlias]
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
      return this.items.map((item: any) => item[this.idField])
    },
    items() {
      return Object.values(this.itemsById) as M[]
    },
    tempIds() {
      return this.temps.map((temp: any) => temp[this.tempIdField])
    },
    temps() {
      return Object.values(this.tempsById) as M[]
    },
    cloneIds() {
      return this.clones.map((clone: any) => clone[this.idField])
    },
    clones() {
      return Object.values(this.clonesById) as M[]
    },
    findInStore() {
      return (params: Params) => {
        params = { ...unref(params) } || {}

        const { paramsForServer, whitelist, itemsById } = this
        const q = _.omit(params.query || {}, ...paramsForServer)

        const { query, filters } = filterQuery(q, {
          filters: {
            $and: true,
            $or: true,
          },
          operators: additionalOperators
            .concat(whitelist || [])
            .concat(['$like', '$iLike', '$ilike', '$notLike', '$notILike'])
            .concat(this.service.options?.allow || this.service.options?.whitelist || []),
        })
        if (filters.$or) query.$or = filters.$or
        if (filters.$and) query.$and = filters.$and

        let values = _.values(itemsById)

        if (params.temps) {
          values.push(..._.values(this.tempsById))
        }

        values = values.filter(sift(query, { operations }))

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

        // TODO: explore if there's any useful benefit to $select on the client. Right now this causes an infinite loop.
        // if (filters.$select) {
        //   values = values.map((value) => _.pick(value, ...filters.$select.slice(), this.idField, this.tempIdField))
        // }

        // Make sure items are instances
        values = values.map((item) => {
          if (item && !item.constructor.modelName) {
            // @ts-expect-error it's ok to do this side effect once.
            item = this.addOrUpdate(item)
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
        params = { ...unref(params) }

        if (!params.query) {
          throw 'params must contain a query-object'
        }

        params.query = _.omit(params.query, ...FILTERS)

        return this.findInStore(params).total
      }
    },
    getFromStore() {
      return (id: Id | null, params: Params = {}) => {
        id = unref(id)
        params = fastCopy(unref(params) || {})

        let item = null
        const existingItem = this.itemsById[id as Id] && select(params, this.idField)(this.itemsById[id as Id])
        const tempItem = this.tempsById[id as Id] && select(params, this.tempIdField)(this.tempsById[id as Id])

        if (existingItem) item = existingItem
        else if (tempItem) item = tempItem

        // Make sure item is an instance
        if (item && !item.constructor.modelName) {
          // @ts-expect-error access action in getter is not intended
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
  }

  return Object.assign(defaultGetters, options.getters)
}

function makePending(method: string, store: any): boolean {
  const isPending = Object.keys(store.pendingById).reduce((isPending, key) => {
    return store.pendingById[key][method] || isPending
  }, false)
  return isPending
}
