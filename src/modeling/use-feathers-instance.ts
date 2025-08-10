import type { FeathersService, Params } from '@feathersjs/feathers'
import type { PiniaService } from '../create-pinia-service.js'
import type { AnyData } from '../types.js'
import type { ServiceInstanceProps } from './types.js'
import { BadRequest } from '@feathersjs/errors'
import { defineGetters, defineValues } from '../utils/define-properties'

export type Service = FeathersService | PiniaService<FeathersService>

export interface useServiceInstanceOptions<S extends Service> {
  service: S
  store: any
}

export function useServiceInstance<M extends AnyData, S extends Service, P extends Params = Params>(data: M, options: useServiceInstanceOptions<S>) {
  if (data.__isServiceInstance)
    return data

  const { service, store } = options
  const merge = (data: M, toMerge: AnyData) => Object.assign(data, toMerge)

  defineGetters(data, {
    isPending() {
      return this.isCreatePending || this.isPatchPending || this.isRemovePending
    },
    isSavePending() {
      return this.isCreatePending || this.isPatchPending
    },
    isCreatePending() {
      return !!(store.createPendingById[this[store.idField]] || store.createPendingById[this.__tempId])
    },
    isPatchPending() {
      return !!store.patchPendingById[this[store.idField]]
    },
    isRemovePending() {
      return !!store.removePendingById[this[store.idField]]
    },
  } as any)

  defineValues(data, {
    __isServiceInstance: true,
    save(this: M, params?: P) {
      const id = this[store.idField]
      return id != null ? this.patch(params) : this.create(params)
    },
    create(this: M, params?: P): Promise<M> {
      return service.create(this, params).then(result => merge(this, result))
    },
    patch(this: M, params?: P): Promise<M> {
      const id = this[store.idField]
      if (id === undefined)
        throw new BadRequest('the item has no id')
      return (service as FeathersService).patch(id as any, this as any, params as any).then(result => merge(this, result))
    },
    remove(this: M, params?: P): Promise<M> {
      if (this.__isTemp) {
        store.removeFromStore(this.__tempId)
        return Promise.resolve(this)
      }
      else {
        const id = this[store.idField]
        return (service as FeathersService).remove(id, params).then(result => merge(this, result))
      }
    },
  })

  return data as M & ServiceInstanceProps<M, AnyData, P>
}
