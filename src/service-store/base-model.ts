import { getId } from '../utils'
import { AnyData, ModelInstanceOptions } from './types'
import { Id, NullableId, Params } from '@feathersjs/feathers'
import { models } from '../models'
import { EventEmitter } from 'events'

interface InstanceModifierOptions {
  models: { [id: string]: any }
  store: any
}

export class BaseModel {
  static store = null
  static pinia = null
  static servicePath = null
  static idField = ''

  public __isClone!: boolean

  constructor(data: AnyData, options: ModelInstanceOptions = {}) {
    const { store, instanceDefaults, setupInstance } = this.constructor as typeof BaseModel
    Object.assign(this, instanceDefaults(data, { models, store }))
    Object.assign(this, setupInstance(data, { models, store }))
    this.__isClone = !!options.clone
    return this
  }

  public static instanceDefaults(data: AnyData, options?: InstanceModifierOptions): AnyData
  public static instanceDefaults(data: AnyData) {
    return data
  }

  public static setupInstance(data: AnyData, options?: InstanceModifierOptions): AnyData
  public static setupInstance(data: AnyData) {
    return data
  }

  public static find(params?: Params) {
    return (this.store as any).find(params)
  }
  public static findInStore(params?: Params) {
    return (this.store as any).findInStore(params)
  }
  public static get(id: Id, params?: Params) {
    return (this.store as any).get(id, params)
  }
  public static getFromStore(id: Id, params?: Params) {
    return (this.store as any).getFromStore(id, params)
  }
  public static count(params?: Params) {
    return (this.store as any).count(params)
  }
  public static countInStore(params?: Params) {
    return (this.store as any).countInStore(params)
  }
  public static addToStore(data?: any) {
    return (this.store as any).addToStore(data)
  }
  public static update(id: Id, data: any, params?: Params) {
    return (this.store as any).update(id, data, params);
  }
  public static patch(id: NullableId, data: any, params?: Params) {
    return (this.store as any).patch(id, data, params);
  }
  public static remove(id: NullableId, params?: Params) {
    return (this.store as any).remove(id, params)
  }
  public static removeFromStore(params?: Params) {
    return (this.store as any).removeFromStore(params)
  }

  get isSavePending() {
    const { store } = this.constructor as typeof BaseModel
    const pending = (store as any).pendingById[getId(this)]
    return pending?.create || pending?.update || pending?.patch || false
  }
  get isCreatePending() {
    const { store } = this.constructor as typeof BaseModel
    return (store as any).pendingById[getId(this)]?.create || false
  }
  get isPatchPending() {
    const { store } = this.constructor as typeof BaseModel
    return (store as any).pendingById[getId(this)]?.patch || false
  }
  get isUpdatePending() {
    const { store } = this.constructor as typeof BaseModel
    return (store as any).pendingById[getId(this)]?.update || false
  }
  get isRemovePending() {
    const { store } = this.constructor as typeof BaseModel
    return (store as any).pendingById[getId(this)]?.remove || false
  }

  get isPending() {
    const { store } = this.constructor as typeof BaseModel
    const pending = (store as any).pendingById[getId(this)]
    return pending?.create || pending?.update || pending?.patch || pending?.remove || false
  }

  /**
   * Add the current record to the store
   */
  public addToStore() {
    const { store }: { store: any } = this.constructor as typeof BaseModel
    return store.addToStore(this)
  }

  /**
   * clone the current record using the `createCopy` mutation
   */
  public clone(data: AnyData = {}): this {
    const { store } = this.constructor as typeof BaseModel
    return (store as any).clone(this, data)
  }

  /**
   * Update a store instance to match a clone.
   */
  public commit(): this {
    const { store } = this.constructor as typeof BaseModel
    if (this.__isClone) {
      return (store as any).commit(this)
    } else {
      throw new Error('You cannot call commit on a non-copy')
    }
  }

  /**
   * Update a store instance to match a clone.
   */
  public reset(): this {
    const { store } = this.constructor as typeof BaseModel

    return (store as any).resetCopy(this)
  }

  /**
   * A shortcut to either call create or patch/update
   * @param params
   */
  public save(params?: any): Promise<this> {
    const { idField } = this.constructor as typeof BaseModel
    const id = getId(this, idField)
    if (id != null) {
      return this.patch(params)
    } else {
      return this.create(params)
    }
  }

  /**
   * Calls service create with the current instance data
   * @param params
   */
  public create(params?: any): Promise<this> {
    const { idField, store } = this.constructor as typeof BaseModel
    const data: any = Object.assign({}, this)
    if (data[idField] === null) {
      delete data[idField]
    }
    return (store as any).create(data, params)
  }

  /**
   * Calls service patch with the current instance data
   * @param params
   */
  public patch(params?: any): Promise<this> {
    const { idField, store } = this.constructor as typeof BaseModel
    const id = getId(this, idField)

    if (id == null) {
      const error = new Error(
        `Missing ${idField} property. You must create the data before you can patch with this data`,
      )
      return Promise.reject(error)
    }
    return (store as any).patch(id, this, params)
  }

  /**
   * Calls service update with the current instance data
   * @param params
   */
  public update(params?: any): Promise<this> {
    const { idField, store } = this.constructor as typeof BaseModel
    const id = getId(this, idField)

    if (id == null) {
      const error = new Error(
        `Missing ${idField} property. You must create the data before you can patch with this data`,
      )
      return Promise.reject(error)
    }
    return (store as any).update(id, this, params)
  }

  /**
   * Calls service remove with the current instance id
   * @param params
   */
  public remove(params?: Params): Promise<this> {
    checkThis(this)
    const { idField, store } = this.constructor as typeof BaseModel
    const id: Id = getId(this, idField)
    return (store as any).remove(id, params)
  }
  /**
   * Removes the instance from the store
   * @param params
   */

  public removeFromStore(params?: Params): Promise<this>
  public removeFromStore(): Promise<this> {
    const { store } = this.constructor as typeof BaseModel
    return (store as any).removeFromStore(this)
  }
}

function checkThis(context: any) {
  if (!context) {
    throw new Error(
      `Instance methods must be called with the dot operator. If you are referencing one in an event, use '@click="() => instance.remove()"' so that the correct 'this' context is applied. Using '@click="instance.remove"' will call the remove function with "this" set to 'undefined' because the function is called directly instead of as a method.`,
    )
  }
}

for (const n in EventEmitter.prototype) {
  // eslint-disable-next-line @typescript-eslint/no-extra-semi
  ;(BaseModel as any)[n] = (EventEmitter.prototype as any)[n]
}
