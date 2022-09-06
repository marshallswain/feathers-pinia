import { getId, getTempId, getAnyId } from '../utils'
import {
  AnyData,
  AnyDataOrArray,
  ModelInstanceOptions,
  ModelStatic,
  ServiceStoreDefault,
  BaseModelModifierOptions,
  BaseModelAssociations,
} from './types'
import { Id, NullableId, Params } from '@feathersjs/feathers'
import { models } from '../models'
import { EventEmitter } from 'events'

export class BaseModel implements AnyData {
  static readonly store: ServiceStoreDefault<BaseModel>
  static readonly models = models
  static pinia = null
  static servicePath = ''
  static idField = ''
  static modelName = ''
  static tempIdField = ''
  static associations: BaseModelAssociations = {}

  public __isClone!: boolean

  constructor(data: Record<string, any> = {}, options: ModelInstanceOptions = {}) {
    const { store, instanceDefaults } = this.Model
    Object.assign(this, instanceDefaults.call(this.Model, data, { models, store }))

    Object.defineProperty(this, '__isClone', {
      value: !!options.clone,
    })
    return this
  }

  public static instanceDefaults<M extends BaseModel>(
    this: ModelStatic<M>,
    data: AnyData,
    options?: BaseModelModifierOptions,
  ): AnyData
  static instanceDefaults<M extends BaseModel>(this: ModelStatic<M>, data: AnyData): AnyData {
    return data
  }

  //#region EventEmitter

  static emitter = new EventEmitter()

  public static addEventListener<M extends BaseModel>(
    this: ModelStatic<M>,
    eventName: string | symbol,
    listener: (...args: any[]) => void,
  ) {
    this.emitter.addListener(eventName, listener)
    return this
  }

  public static emit<M extends BaseModel>(this: ModelStatic<M>, eventName: string | symbol, ...args: any[]) {
    return this.emitter.emit(eventName, ...args)
  }

  public static eventNames<M extends BaseModel>(this: ModelStatic<M>) {
    return this.emitter.eventNames()
  }

  public static getMaxListeners<M extends BaseModel>(this: ModelStatic<M>) {
    return this.emitter.getMaxListeners()
  }

  public static listenerCount<M extends BaseModel>(this: ModelStatic<M>, eventName: string | symbol) {
    return this.emitter.listenerCount(eventName)
  }

  public static listeners<M extends BaseModel>(this: ModelStatic<M>, eventName: string | symbol) {
    return this.emitter.listeners(eventName)
  }

  public static off<M extends BaseModel>(
    this: ModelStatic<M>,
    eventName: string | symbol,
    listener: (...args: any[]) => void,
  ) {
    this.emitter.off(eventName, listener)
    return this
  }

  public static on<M extends BaseModel>(
    this: ModelStatic<M>,
    eventName: string | symbol,
    listener: (...args: any[]) => void,
  ) {
    this.emitter.on(eventName, listener)
    return this
  }

  public static once<M extends BaseModel>(
    this: ModelStatic<M>,
    eventName: string | symbol,
    listener: (...args: any[]) => void,
  ) {
    this.emitter.once(eventName, listener)
    return this
  }

  public static prependListener<M extends BaseModel>(
    this: ModelStatic<M>,
    eventName: string | symbol,
    listener: (...args: any[]) => void,
  ) {
    this.emitter.prependListener(eventName, listener)
    return this
  }

  public static prependOnceListener<M extends BaseModel>(
    this: ModelStatic<M>,
    eventName: string | symbol,
    listener: (...args: any[]) => void,
  ) {
    this.emitter.prependOnceListener(eventName, listener)
    return this
  }

  public static rawListeners<M extends BaseModel>(this: ModelStatic<M>, eventName: string | symbol) {
    return this.emitter.rawListeners(eventName)
  }

  public static removeAllListeners<M extends BaseModel>(this: ModelStatic<M>, eventName?: string | symbol) {
    this.emitter.removeAllListeners(eventName)
    return this
  }

  public static removeListener<M extends BaseModel>(
    this: ModelStatic<M>,
    eventName: string | symbol,
    listener: (...args: any[]) => void,
  ) {
    this.emitter.removeListener(eventName, listener)
    return this
  }

  public static setMaxListeners<M extends BaseModel>(this: ModelStatic<M>, n: number) {
    this.emitter.setMaxListeners(n)
    return this
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
  public static update<M extends BaseModel>(this: ModelStatic<M>, id: Id, data: AnyData, params?: Params) {
    return this.store.update(id, data, params)
  }
  public static patch<M extends BaseModel>(this: ModelStatic<M>, id: NullableId, data: AnyData, params?: Params) {
    return this.store.patch(id, data, params)
  }
  public static remove<M extends BaseModel>(this: ModelStatic<M>, id: NullableId, params?: Params) {
    return this.store.remove(id, params)
  }
  public static removeFromStore<M extends BaseModel>(this: ModelStatic<M>, data: AnyDataOrArray) {
    return this.store.removeFromStore(data)
  }

  get Model() {
    return this.constructor as ModelStatic<BaseModel>
  }

  /**
   * Call `this.init` in a Class's constructor to run `instanceDefaults` and `setupInstance` properly.
   * This allows default values to be specified directly in the Class's interface.
   * @param data
   */
  public init(data: Record<string, any>) {
    const { instanceDefaults, setupInstance } = this.Model as any

    // If you call these here, you can use default values in the Model interface.
    if (instanceDefaults) Object.assign(this, instanceDefaults.call(this.Model, data), data)
    if (setupInstance) setupInstance.call(this.Model, this)
  }

  public getId() {
    return getId(this, this.Model.idField)
  }
  public getTempId() {
    const { tempIdField } = this.Model
    return getTempId(this, tempIdField)
  }
  public getAnyId() {
    const { tempIdField, idField } = this.Model
    return getAnyId(this, tempIdField, idField)
  }

  get __isTemp() {
    const { idField } = this.Model
    return getId(this, idField) == null
  }

  get isSavePending() {
    const { store, idField } = this.Model
    const pending = store.pendingById[getId(this, idField)]
    return pending?.create || pending?.update || pending?.patch || false
  }
  get isCreatePending(): boolean {
    const { store, idField } = this.Model
    return store.pendingById[getId(this, idField)]?.create || false
  }
  get isPatchPending(): boolean {
    const { store, idField } = this.Model
    return store.pendingById[getId(this, idField)]?.patch || false
  }
  get isUpdatePending(): boolean {
    const { store, idField } = this.Model
    return store.pendingById[getId(this, idField)]?.update || false
  }
  get isRemovePending(): boolean {
    const { store, idField } = this.Model
    return store.pendingById[getId(this, idField)]?.remove || false
  }

  get isPending(): boolean {
    const { store, idField } = this.Model
    const pending = store.pendingById[getId(this, idField)]
    return pending?.create || pending?.update || pending?.patch || pending?.remove || false
  }

  /**
   * Add the current record to the store
   */
  public addToStore() {
    const { store } = this.Model
    return store.addToStore(this)
  }

  /**
   * clone the current record using the `clone` action
   */
  public clone(data?: AnyData): this {
    const { store } = this.Model

    // @ts-expect-error todo
    return store.clone(this, data)
  }

  /**
   * Update a store instance to match a clone.
   */
  public commit(): this {
    const { store } = this.Model
    if (this.__isClone) {
      // @ts-expect-error todo
      return store.commit(this)
    } else {
      throw new Error('You cannot call commit on a non-copy')
    }
  }

  /**
   * Update a clone to match a store instance.
   */
  public reset(data: AnyData = {}): this {
    const { store } = this.Model

    return store.reset(this, data) as this
  }

  /**
   * A shortcut to either call create or patch/update
   * @param params
   */
  public save(params?: any): Promise<this> {
    const { idField } = this.Model
    const id = getId(this, idField)
    return id != null ? this.patch(params) : this.create(params)
  }

  /**
   * Calls service create with the current instance data
   * @param params
   */
  public async create(params?: any): Promise<this> {
    const { idField, store } = this.Model
    const data: any = Object.assign({}, this)
    if (data[idField] === null) {
      delete data[idField]
    }
    const { __isClone } = this
    const saved = (await store.create(data, params)) as this

    // For non-reactive instances, update the instance with created data.
    Object.assign(this, saved)

    return __isClone ? saved.clone() : saved
  }

  /**
   * Calls service patch with the current instance data
   * @param params
   */
  public async patch(params?: any): Promise<this> {
    const { idField, store } = this.Model
    const id = getId(this, idField)

    if (id == null) {
      const error = new Error(
        `Missing ${idField} property. You must create the data before you can patch with this data`,
      )
      return Promise.reject(error)
    }
    const { __isClone } = this
    const saved = (await store.patch(id, this, params)) as this
    return __isClone ? saved.clone() : saved
  }

  /**
   * Calls service update with the current instance data
   * @param params
   */
  public async update(params?: any): Promise<this> {
    const { idField, store } = this.Model
    const id = getId(this, idField)

    if (id == null) {
      const error = new Error(
        `Missing ${idField} property. You must create the data before you can patch with this data`,
      )
      return Promise.reject(error)
    }
    const { __isClone } = this
    const saved = (await store.update(id, this, params)) as this
    return __isClone ? saved.clone() : saved
  }

  /**
   * Calls service remove with the current instance id
   * @param params
   */
  public remove(params?: Params): Promise<this> {
    checkThis(this)
    const { idField, store } = this.Model
    const id: Id = getId(this, idField)
    return store.remove(id, params)
  }
  /**
   * Removes the instance from the store
   */
  public removeFromStore(): this {
    const { store } = this.Model
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
