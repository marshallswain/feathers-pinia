import { getId } from '../utils'
import { AnyData, Model, ModelInstanceOptions, ServiceStore } from './types'
import { Id, Params } from '@feathersjs/feathers'
import { models } from '../models'

export class BaseModel implements Model {
  static store: ServiceStore
  static pinia = null
  static servicePath: string
  static idField: string

  public __isClone!: boolean

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(data: AnyData, options: ModelInstanceOptions = {}) {
    const { store, instanceDefaults, setupInstance } = this.constructor as typeof BaseModel
    Object.assign(this, instanceDefaults(data, { models, store }))
    Object.assign(this, setupInstance(data, { models, store }))
    return this
  }

  public static instanceDefaults(
    data: AnyData, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    models: { [name: string]: Model },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    store: ServiceStore
    ): AnyData {
    return data
  }
  public static setupInstance(
    data: AnyData, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    models: { [name: string]: Model },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    store: ServiceStore
    ): AnyData {
    return data
  }

  public static find(params?: Params) {
    return this.store.find(params)
  }
  public static findInStore(params?: Params) {
    return this.store.findInStore(params)
  }
  public static get(id: Id, params?: Params) {
    return this.store.get(id, params)
  }
  public static getFromStore(id: Id, params?: Params) {
    return this.store.getFromStore(id, params)
  }
  public static count(params?: Params) {
    return this.store.count(params)
  }
  public static countInStore(params?: Params) {
    return this.store.countInStore(params)
  }
  public static addToStore(data?: any) {
    return this.store.add(data)
  }
  public static remove(params?: Params) {
    return this.store.remove(params)
  }
  public static removeFromStore(params?: Params) {
    return this.store.removeFromStore(params)
  }

  get isSavePending(): boolean {
    const { idField, store } = this.constructor as typeof BaseModel
    const pending = (store).pendingById[getId(this)]
    return pending?.create || pending?.update || pending?.patch || false
  }
  get isCreatePending(): boolean {
    const { idField, store } = this.constructor as typeof BaseModel
    return (store as any).pendingById[getId(this)]?.create || false
  }
  get isPatchPending(): boolean {
    const { idField, store } = this.constructor as typeof BaseModel
    return (store as any).pendingById[getId(this)]?.patch || false
  }
  get isUpdatePending(): boolean {
    const { idField, store } = this.constructor as typeof BaseModel
    return (store as any).pendingById[getId(this)]?.update || false
  }
  get isRemovePending(): boolean {
    const { idField, store } = this.constructor as typeof BaseModel
    return (store as any).pendingById[getId(this)]?.remove || false
  }

  /**
   * Add the current record to the store
   */
  public addToStore(): void {
    const { store } = this.constructor as typeof BaseModel
    store.add(this)
  }

  /**
   * clone the current record using the `createCopy` mutation
   */
  public clone(data: AnyData = {}): this {
    const { store } = this.constructor as typeof BaseModel
    return store.clone(this, data)
  }

  /**
   * Update a store instance to match a clone.
   */
  public commit(): this {
    const { idField, store } = this.constructor as typeof BaseModel
    if (this.__isClone) {
      return store.commit(this)
    } else {
      throw new Error('You cannot call commit on a non-copy')
    }
  }

  /**
   * Update a store instance to match a clone.
   */
  public reset(): this {
    const { idField, store } = this.constructor as typeof BaseModel

    // TODO @marshallswain: resetCopy is not defined!
    return store.resetCopy(this)
  }

  /**
   * A shortcut to either call create or patch/update
   * @param params
   */
  public save(params?: Params): Promise<this> {
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
    return store.create(data, params)
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
        `Missing ${idField} property. You must create the data before you can patch with this data`
      )
      return Promise.reject(error)
    }
    return store.patch(id, this, params)
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
        `Missing ${idField} property. You must create the data before you can patch with this data`
      )
      return Promise.reject(error)
    }
    return store.update(id, this, params)
  }

  /**
   * Calls service remove with the current instance id
   * @param params
   */
  public remove(params?: Params): Promise<this> {
    checkThis(this)
    const { idField, store } = this.constructor as typeof BaseModel
    const id: Id = getId(this, idField)
    return store.remove(id, params)
  }
  /**
   * Removes the instance from the store
   * @param params
   */
  public removeFromStore(params?: Params): Promise<this> {
    const { store } = this.constructor as typeof BaseModel
    return store.removeFromStore(this)
  }
}

function checkThis(context: any): void {
  if (!context) {
    throw new Error(
      `Instance methods must be called with the dot operator. If you are referencing one in an event, use '@click="() => instance.remove()"' so that the correct 'this' context is applied. Using '@click="instance.remove"' will call the remove function with "this" set to 'undefined' because the function is called directly instead of as a method.`
    )
  }
}
