import type { Params, Service } from '@feathersjs/feathers'
import { AnyData } from '../use-service'
import { FeathersInstanceProps } from './types'
import { defineProperties } from './utils'

export interface useFeathersInstanceOptions<S extends Service> {
  service: S
}

export const useFeathersInstance = <M extends AnyData, S extends Service = Service, P extends Params = Params>(
  options: useFeathersInstanceOptions<S>,
  data: M,
) => {
  const service = options.service
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
          this.__Model.store.createPendingById[this[this.__idField]] ||
          this.__Model.store.createPendingById[this.__tempId]
        )
      },
    },
    isPatchPending: {
      enumerable: false,
      configurable: true,
      get() {
        return !!this.__Model.store.patchPendingById[this[this.__idField]]
      },
    },
    isRemovePending: {
      enumerable: false,
      configurable: true,
      get() {
        return !!this.__Model.store.removePendingById[this[this.__idField]]
      },
    },
  })
  const methods = {
    save: function (this: M, params?: P) {
      const id = this[this.__idField]
      return id != null ? this.patch(params) : this.create(params)
    },
    create: function (this: M, params?: P): Promise<M> {
      return service.create(this, params).then((result) => merge(this, result))
    },
    patch: function (this: M, params?: P): Promise<M> {
      const id = this[this.__idField]
      return service.patch(id, this, params).then((result) => merge(this, result))
    },
    remove: function (this: M, params?: P): Promise<M> {
      const id = this[this.__idField]
      return service.remove(id, params).then((result) => merge(this, result))
    },
  }

  defineProperties(data, methods)

  return data as M & FeathersInstanceProps<M, AnyData, P>
}
