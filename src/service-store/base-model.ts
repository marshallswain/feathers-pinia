import { getId } from '../utils'
import { AnyData, AnyDataOrArray, ModelInstanceOptions, ModelStatic, ServiceStoreDefault } from './types'
import { Id, NullableId, Params } from '@feathersjs/feathers'
import { models } from '../models'
import { EventEmitter } from 'events'

export interface InstanceModifierOptions {
  models: { [id: string]: any }
  store: any
}

export class BaseModel implements AnyData {
  static readonly store: ServiceStoreDefault<BaseModel>
  static pinia = null
  static servicePath = ''
  static idField = ''
  static modelName = ''

  public __isClone!: boolean

  constructor(data: AnyData, options: ModelInstanceOptions = {}) {
    const ctor = this.constructor as ModelStatic<BaseModel>
    const { store, instanceDefaults, setupInstance } = ctor;
    Object.assign(this, instanceDefaults.call(ctor, data, { models, store }))
    Object.assign(this, setupInstance.call(ctor, data, { models, store }))
    this.__isClone = !!options.clone

    return this
  }

  public static instanceDefaults<M extends BaseModel>(
    this: ModelStatic<M>, 
    data: AnyData, 
    options?: InstanceModifierOptions
  ): AnyData
  public static instanceDefaults<M extends BaseModel>(
    this: ModelStatic<M>, 
    data: AnyData
  ): AnyData {
    return data
  }

  public static setupInstance<M extends BaseModel>(
    this: ModelStatic<M>, 
    data: AnyData, 
    options?: InstanceModifierOptions
  ): AnyData
  public static setupInstance<M extends BaseModel>(
    this: ModelStatic<M>, 
    data: AnyData
  ): AnyData {
    return data
  }

  //#region EventEmitter

  static emitter = new EventEmitter()

  public static addEventListener<M extends BaseModel>(
    this: ModelStatic<M>,
    eventName: string | symbol,
    listener: (...args: any[]) => void
  ) {
    return this.emitter.addListener(eventName, listener)
  }

  public static emit<M extends BaseModel>(
    this: ModelStatic<M>, 
    eventName: string | symbol,
    ...args: any[]
  ) {
    return this.emitter.emit(eventName, ...args)
  }

  public static eventNames<M extends BaseModel>(
    this: ModelStatic<M>
  ) {
    return this.emitter.eventNames()
  }

  public static getMaxListeners<M extends BaseModel>(
    this: ModelStatic<M>
  ) {
    return this.emitter.getMaxListeners()
  }

  public static listenerCount<M extends BaseModel>(
    this: ModelStatic<M>, 
    eventName: string | symbol
  ) {
    return this.emitter.listenerCount(eventName);
  }

  public static listeners<M extends BaseModel>(
    this: ModelStatic<M>, 
    eventName: string | symbol
  ) {
    return this.emitter.listeners(eventName)
  }

  public static off<M extends BaseModel>(
    this: ModelStatic<M>,
    eventName: string | symbol,
    listener: (...args: any[]) => void
  ) {
    return this.emitter.off(eventName, listener)
  }

  public static on<M extends BaseModel>(
    this: ModelStatic<M>,
    eventName: string | symbol,
    listener: (...args: any[]) => void
  ) {
    return this.emitter.on(eventName, listener)
  }

  public static once<M extends BaseModel>(
    this: ModelStatic<M>,
    eventName: string | symbol,
    listener: (...args: any[]) => void
  ) {
    return this.emitter.once(eventName, listener)
  }

  public static prependListener<M extends BaseModel>(
    this: ModelStatic<M>,
    eventName: string | symbol,
    listener: (...args: any[]) => void
  ) {
    return this.emitter.prependListener(eventName, listener)
  }

  public static prependOnceListener<M extends BaseModel>(
    this: ModelStatic<M>,
    eventName: string | symbol,
    listener: (...args: any[]) => void
  ) {
    return this.emitter.prependOnceListener(eventName, listener)
  }

  public static rawListeners<M extends BaseModel>(
    this: ModelStatic<M>,
    eventName: string | symbol
    ) {
    return this.emitter.rawListeners(eventName)
  }

  public static removeAllListeners<M extends BaseModel>(
    this: ModelStatic<M>,
    eventName?: string | symbol
    ) {
    return this.emitter.removeAllListeners(eventName)
  }

  public static removeListener<M extends BaseModel>(
    this: ModelStatic<M>,
    eventName: string | symbol, 
    listener: (...args: any[]) => void
  ) {
    return this.emitter.removeListener(eventName, listener)
  }

  public static setMaxListeners<M extends BaseModel>(
    this: ModelStatic<M>,
    n: number
  ) {
    return this.emitter.setMaxListeners(n)
  }

  //#endregion

  public static find<M extends BaseModel>(this: ModelStatic<M>, params?: Params) {
    return this.store.find(params)
  }
  public static findInStore<M extends BaseModel>(this: ModelStatic<M>, params: Params) {
    return this.store.findInStore(params)
  }
  public static get<M extends BaseModel>(this: ModelStatic<M>, id: Id, params?: Params) {
    return this.store.get(id, params)
  }
  public static getFromStore<M extends BaseModel>(this: ModelStatic<M>, id: Id, params?: Params) {
    return this.store.getFromStore(id, params)
  }
  public static count<M extends BaseModel>(this: ModelStatic<M>, params?: Params) {
    return this.store.count(params)
  }
  public static countInStore<M extends BaseModel>(this: ModelStatic<M>, params: Params) {
    return this.store.countInStore(params)
  }
  public static addToStore<M extends BaseModel>(this: ModelStatic<M>, data: AnyDataOrArray) {
    return this.store.addToStore(data)
  }
  public static update<M extends BaseModel>(
    this: ModelStatic<M>, 
    id: Id, 
    data: AnyData, 
    params?: Params
  ) {
    return this.store.update(id, data, params);
  }
  public static patch<M extends BaseModel>(
    this: ModelStatic<M>, 
    id: NullableId, 
    data: AnyData, 
    params?: Params
  ) {
    return this.store.patch(id, data, params);
  }
  public static remove<M extends BaseModel>(
    this: ModelStatic<M>, 
    id: NullableId, 
    params?: Params
  ) {
    return this.store.remove(id, params)
  }
  public static removeFromStore<M extends BaseModel>(this: ModelStatic<M>, data: AnyDataOrArray) {
    return this.store.removeFromStore(data)
  }

  get isSavePending(): boolean {
    const { store } = this.constructor as ModelStatic<BaseModel>
    const pending = store.pendingById[getId(this)]
    return pending?.create || pending?.update || pending?.patch || false
  }
  get isCreatePending(): boolean {
    const { store } = this.constructor as ModelStatic<BaseModel>
    return store.pendingById[getId(this)]?.create || false
  }
  get isPatchPending(): boolean {
    const { store } = this.constructor as ModelStatic<BaseModel>
    return store.pendingById[getId(this)]?.patch || false
  }
  get isUpdatePending(): boolean {
    const { store } = this.constructor as ModelStatic<BaseModel>
    return store.pendingById[getId(this)]?.update || false
  }
  get isRemovePending(): boolean {
    const { store } = this.constructor as ModelStatic<BaseModel>
    return store.pendingById[getId(this)]?.remove || false
  }

  get isPending(): boolean {
    const { store } = this.constructor as ModelStatic<BaseModel>
    const pending = store.pendingById[getId(this)]
    return pending?.create || pending?.update || pending?.patch || pending?.remove || false
  }

  /**
   * Add the current record to the store
   */
  public addToStore() {
    const { store } = this.constructor as ModelStatic<BaseModel>
    return store.addToStore(this)
  }

  /**
   * clone the current record using the `clone` action
   */
  public clone(data?: AnyData): this {
    const { store } = this.constructor as ModelStatic<BaseModel>

    // @ts-expect-error todo
    return store.clone(this, data)
  }

  /**
   * Update a store instance to match a clone.
   */
  public commit(): this {
    const { store } = this.constructor as ModelStatic<BaseModel>
    if (this.__isClone) {
      // @ts-expect-error todo
      return store.commit(this)
    } else {
      throw new Error('You cannot call commit on a non-copy')
    }
  }

  /**
   * Update a store instance to match a clone.
   */
  public reset(): this {
    const { store } = this.constructor as ModelStatic<BaseModel>

    // @ts-expect-error todo
    return store.resetCopy(this)
  }

  /**
   * A shortcut to either call create or patch/update
   * @param params
   */
  public save(params?: any): Promise<this> {
    const { idField } = this.constructor as ModelStatic<BaseModel>
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
    const { idField, store } = this.constructor as ModelStatic<BaseModel>
    const data: any = Object.assign({}, this)
    if (data[idField] === null) {
      delete data[idField]
    }
    return store.create(data, params) as Promise<this>
  }

  /**
   * Calls service patch with the current instance data
   * @param params
   */
  public patch(params?: any): Promise<this> {
    const { idField, store } = this.constructor as ModelStatic<BaseModel>
    const id = getId(this, idField)

    if (id == null) {
      const error = new Error(
        `Missing ${idField} property. You must create the data before you can patch with this data`,
      )
      return Promise.reject(error)
    }
    return store.patch(id, this, params) as Promise<this>
  }

  /**
   * Calls service update with the current instance data
   * @param params
   */
  public update(params?: any): Promise<this> {
    const { idField, store } = this.constructor as ModelStatic<BaseModel>
    const id = getId(this, idField)

    if (id == null) {
      const error = new Error(
        `Missing ${idField} property. You must create the data before you can patch with this data`,
      )
      return Promise.reject(error)
    }
    return store.update(id, this, params) as Promise<this>
  }

  /**
   * Calls service remove with the current instance id
   * @param params
   */
  public remove(params?: Params): Promise<this> {
    checkThis(this)
    const { idField, store } = this.constructor as ModelStatic<BaseModel>
    const id: Id = getId(this, idField)
    return store.remove(id, params)
  }
  /**
   * Removes the instance from the store
   */
  public removeFromStore(): this {
    const { store } = this.constructor as ModelStatic<BaseModel>
    return store.removeFromStore(this)
  }
}

function checkThis(context: any) {
  if (!context) {
    throw new Error(
      `Instance methods must be called with the dot operator. If you are referencing one in an event, use '@click="() => instance.remove()"' so that the correct 'this' context is applied. Using '@click="instance.remove"' will call the remove function with "this" set to 'undefined' because the function is called directly instead of as a method.`,
    )
  }
}