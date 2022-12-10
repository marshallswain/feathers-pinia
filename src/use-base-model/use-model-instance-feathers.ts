import type { Params, Service } from '@feathersjs/feathers'
import { AnyData } from '../use-service'
import { defineProperties } from './utils'

export const useInstanceFeathers = <M extends AnyData, S extends Service = Service, P extends Params = Params>(
  data: M,
  service: S,
) => {
  const methods = {
    merge: function (data: M): M {
      return Object.assign(this, data)
    },
    save: function (this: M, params?: P) {
      const id = this[this.__idField]
      return id ? this.patch(params) : this.create(params)
    },
    create: function (this: M, params?: P): Promise<M> {
      return service.create(this, params).then(this.merge)
    },
    patch: function (this: M, params?: P): Promise<M> {
      const id = this[this.__idField]
      return service.patch(id, this, params).then(this.merge)
    },
    remove: function (this: M, params?: P): Promise<M> {
      const id = this[this.__idField]
      return service.remove(id, params).then(this.merge)
    },
  }

  defineProperties(data, methods)

  return data as M & typeof methods
}
