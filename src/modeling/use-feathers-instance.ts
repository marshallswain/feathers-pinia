import { BadRequest } from '@feathersjs/errors'
import type { FeathersService, Params } from '@feathersjs/feathers'
import type { AnyData } from '../types'
import { defineValues, defineGetters } from '../utils/define-properties'
import type { FeathersInstanceProps } from './types'
import type { PiniaService } from '../create-pinia-service'

type Service = FeathersService | PiniaService<FeathersService>

export interface useFeathersInstanceOptions<S extends Service> {
  service: S
  store: any
}

export const useFeathersInstance = <M extends AnyData, S extends Service, P extends Params = Params>(
  data: M,
  options: useFeathersInstanceOptions<S>,
) => {
  if (data.__isFeathersInstance) return data

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
    __isFeathersInstance: true,
    save(this: M, params?: P) {
      const id = this[store.idField]
      return id != null ? this.patch(params) : this.create(params)
    },
    create(this: M, params?: P): Promise<M> {
      return service.create(this, params).then((result) => merge(this, result))
    },
    patch(this: M, params?: P): Promise<M> {
      const id = this[store.idField]
      if (id === undefined) throw new BadRequest('the item has no id')
      return service.patch(id, this, params).then((result) => merge(this, result))
    },
    remove(this: M, params?: P): Promise<M> {
      if (this.__isTemp) {
        store.removeFromStore(this.__tempId)
        return Promise.resolve(this)
      } else {
        const id = this[store.idField]
        return service.remove(id, params).then((result) => merge(this, result))
      }
    },
  })

  return data as M & FeathersInstanceProps<M, AnyData, P>
}
