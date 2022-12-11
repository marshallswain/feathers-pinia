import type { Params, Service } from '@feathersjs/feathers'
import { AnyData } from '../use-service'
import { defineProperties } from './utils'

export interface UseModelInstanceFeathersOptions<S extends Service> {
  service: S
}

export const useModelInstanceFeathers = <M extends AnyData, S extends Service = Service, P extends Params = Params>(
  data: M,
  options: UseModelInstanceFeathersOptions<S>,
) => {
  const service = options.service
  const merge = (data: M, toMerge: AnyData) => Object.assign(data, toMerge)
  const methods = {
    save: function (this: M, params?: P) {
      const id = this[this.__idField]
      return id ? this.patch(params) : this.create(params)
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

  return data as M & typeof methods
}
