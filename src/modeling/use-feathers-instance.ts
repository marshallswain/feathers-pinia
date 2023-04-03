import { BadRequest } from '@feathersjs/errors'
import type { FeathersService, Params } from '@feathersjs/feathers'
import type { AnyData } from '../types'
import { defineProperties } from '../utils/define-properties'
import type { FeathersInstanceProps } from './types'

type ServiceNoUpdate = Omit<FeathersService, 'update'>

export interface useFeathersInstanceOptions<S extends ServiceNoUpdate> {
  service: S
  store: any
}

export const useFeathersInstance = <
    M extends AnyData,
    S extends ServiceNoUpdate = ServiceNoUpdate,
    P extends Params = Params,
  >(
    data: M,
    options: useFeathersInstanceOptions<S>,
  ) => {
  const { service, store } = options

  const merge = (data: M, toMerge: AnyData) => Object.assign(data, toMerge)
  Object.defineProperties(data, {
    isPending: {
      enumerable: false,
      configurable: true,
      get() {
        return this.isCreatePending || this.isPatchPending || this.isRemovePending
      },
    },
    isSavePending: {
      enumerable: false,
      configurable: true,
      get() {
        return this.isCreatePending || this.isPatchPending
      },
    },
    isCreatePending: {
      enumerable: false,
      configurable: true,
      get() {
        return !!(
          store.createPendingById[this[store.idField]]
          || store.createPendingById[this.__tempId]
        )
      },
    },
    isPatchPending: {
      enumerable: false,
      configurable: true,
      get() {
        return !!store.patchPendingById[this[store.idField]]
      },
    },
    isRemovePending: {
      enumerable: false,
      configurable: true,
      get() {
        return !!store.removePendingById[this[store.idField]]
      },
    },
  })
  const methods = {
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
      return service.patch(id, this, params).then(result => merge(this, result))
    },
    remove(this: M, params?: P): Promise<M> {
      if (this.__isTemp) {
        store.removeFromStore(this.__tempId)
        return Promise.resolve(this)
      }
      else {
        const id = this[store.idField]
        return service.remove(id, params).then(result => merge(this, result))
      }
    },
  }

  defineProperties(data, methods)

  return data as M & FeathersInstanceProps<M, AnyData, P>
}
