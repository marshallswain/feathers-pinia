import type { Params as FeathersParams, FeathersService, Id } from '@feathersjs/feathers'
import type { AnyData, Params, Query } from './types.js'
import type { MaybeRef } from '@vueuse/core'
import type { UseFindOptions, UseFindParams, UseGetParams } from './use-find-get/index.js'
import type { ComputedRef } from 'vue-demi'
import { reactive, computed, isRef, ref, unref } from 'vue-demi'
import { getParams, existingServiceMethods } from './utils/index.js'
import { useFind, useGet } from './use-find-get/index.js'
import { convertData } from './utils/convert-data'
import { ServiceInstance } from './modeling/index.js'

interface PiniaServiceOptions {
  servicePath: string
  store: any
}

export class PiniaService<Svc extends FeathersService> {
  store
  servicePath = ''

  constructor(public service: Svc, public options: PiniaServiceOptions) {
    this.store = options.store
    this.servicePath = options.servicePath

    // copy custom methods from service onto this instance, exclude existing methods
    const keysToIgnore = Object.getOwnPropertyNames(Object.getPrototypeOf(this)).concat(existingServiceMethods)
    for (const key in service) {
      if (typeof service[key] === 'function' && !keysToIgnore.includes(key)) {
        const instance = this as any
        instance[key] = (service[key] as any).bind(service)
      }
    }
  }

  /**
   * Prepare new "instances" outside of store
   *
   * Functionally upgrades plain data to a service model "instance".
   * - flags each record with `__isSetup` to avoid duplicate work.
   */
  new(data: AnyData = {}) {
    const asInstance = this.store.new(data)
    return reactive(asInstance)
  }

  /* service methods clone params */

  /**
   * finds records from the API server by query. Each record is reactive. Lists are non reactive.
   * For reactive lists, use `findInStore`.
   */
  async find(_params?: MaybeRef<Params<Query>>) {
    const params = getParams(_params)
    const result = await this.service.find(params as FeathersParams)
    return result
  }

  /**
   * finds a single record from the API server by query. The record is reactive.
   */
  async findOne(_params?: MaybeRef<Params<Query>>) {
    const params = getParams(_params)
    params.query = params.query || {}
    params.query.$limit = 1
    const result = await this.service.find(params as FeathersParams)
    const item = (result.data || result)[0] || null
    return item
  }

  /**
   * count records on the API server by query. Returns the number of matching records.
   */
  async count(_params?: MaybeRef<Params<Query>>) {
    const params = getParams(_params)
    params.query = params.query || {}
    params.query.$limit = 0
    const result = await this.service.find(params as FeathersParams)
    return result
  }

  /**
   * retrieve a record from the API server by id. The record is reactive.
   */
  async get(id: Id, _params?: MaybeRef<Params<Query>>) {
    const params = getParams(_params)
    const result = await this.service.get(id, params)
    return result
  }

  /**
   * create a record on the API server.
   */
  async create(data: AnyData) {
    const result = await this.service.create(data)
    return result
  }

  /**
   * patch a record on the API server.
   */
  async patch(id: Id, data: AnyData, _params?: MaybeRef<Params<Query>>) {
    const params = getParams(_params)
    const result = await this.service.patch(id, data, params)
    return result
  }

  /**
   * remove a record from the API server.
   */
  async remove(id: Id, _params?: MaybeRef<Params<Query>>) {
    const params = getParams(_params)
    const result = await this.service.remove(id, params)
    return result
  }

  /* store methods accept refs and don't copy params */

  /**
   * find records in the local store. The returned list and records are reactive.
   */
  findInStore(params?: MaybeRef<Params<Query>>) {
    const result = this.store.findInStore(params)
    return {
      ...result,
      data: computed(() => {
        return result.data.value.map((i: any) => convertData(this, i))
      }),
    }
  }

  /**
   * find a single record in the local store by query.
   */
  findOneInStore(params?: MaybeRef<Params<Query>>) {
    const result = this.store.findOneInStore(params)
    return result
  }

  /**
   * count records matching a query in the store.
   */
  countInStore(params?: MaybeRef<Params<Query>>) {
    const result = this.store.countInStore(params)
    return result
  }

  /**
   * get a single record from the store by id
   */
  getFromStore(id: Id, params?: MaybeRef<Params<Query>>): ComputedRef<ServiceInstance<AnyData>> {
    const result = this.store.getFromStore(id, params)
    return result
  }

  /**
   * creates or adds an item to the store.
   */
  createInStore(data: AnyData) {
    const result = this.store.createInStore(data)
    return result
  }

  /**
   * patches an item in the store
   */
  patchInStore<M extends AnyData, Q extends AnyData>(
    idOrData: MaybeRef<M | M[] | Id | null>,
    data: MaybeRef<AnyData> = {},
    params: MaybeRef<Params<Q>> = {},
  ) {
    const result = this.store.patchInStore(idOrData, data, params)
    return result
  }

  /**
   * removes one or more items from the store.
   */
  removeFromStore(id?: Id, params?: MaybeRef<Params<Query>>) {
    const item = id != null ? this.getFromStore(id).value : null
    if (item) {
      const result = this.store.removeFromStore(item)
      return result
    } else if (id == null && unref(params)?.query) {
      const result = this.store.removeByQuery(params)
      return result
    }
  }

  /* hybrid methods */

  useFind(params: ComputedRef<UseFindParams | null>, options?: UseFindOptions) {
    const _params = isRef(params) ? params : ref(params)
    return useFind(_params, options, { service: this })
  }

  useGet(id: MaybeRef<Id | null>, params: MaybeRef<UseGetParams> = ref({})) {
    const _id = isRef(id) ? id : ref(id)
    const _params = isRef(params) ? params : ref(params)
    return useGet(_id, _params, { service: this })
  }

  useGetOnce(_id: MaybeRef<Id | null>, params: MaybeRef<UseGetParams> = {}) {
    const _params = isRef(params) ? params : ref(params)
    Object.assign(_params.value, { immediate: false })
    const results = this.useGet(_id, _params)
    results.queryWhen(() => !results.data.value)
    results.get()
    return results
  }

  /* events */

  on(eventName: string | symbol, listener: (...args: any[]) => void) {
    return this.service.on(eventName, listener)
  }

  emit(eventName: string | symbol, ...args: any[]): boolean {
    return this.service.emit(eventName, ...args)
  }

  removeListener(eventName: string | symbol, listener: (...args: any[]) => void) {
    return this.service.removeListener(eventName, listener)
  }
}
