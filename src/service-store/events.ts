import { getId, hasOwn } from '../utils'
import _debounce from 'lodash/debounce'
import { models } from '../models'
import { DefineFeathersStoreOptions, HandledEvents } from '../types'
import { DefaultServiceStore } from './types'
import { BaseModel } from '.'
// @ts-expect-error todo
import { Class } from 'type-fest'
import { EventEmitter } from 'stream'

export interface ServiceEventsDebouncedQueue {
  addOrUpdateById: any
  removeItemById: any
  enqueueAddOrUpdate(item: any): void
  enqueueRemoval(item: any): void
  flushAddOrUpdateQueue(): void
  flushRemoveItemQueue(): void
}

interface EnableServiceEventsOptions<
  M extends BaseModel = BaseModel,
  Store extends DefaultServiceStore = DefaultServiceStore
> {
  service: any
  Model: Class<M> & typeof BaseModel & EventEmitter
  store: Store
  options: EnableServiceEventsOptionsOptions
}

type EnableServiceEventsOptionsOptions = Required<Pick<DefineFeathersStoreOptions, 
  'idField' |
  'handleEvents' |
  'debounceEventsMaxWait' | 
  'debounceEventsTime'
>>

export function enableServiceEvents<
  M extends BaseModel = BaseModel,
  Store extends DefaultServiceStore = DefaultServiceStore
>({
  service,
  Model,
  store,
  options,
}: EnableServiceEventsOptions<M, Store>): ServiceEventsDebouncedQueue {
  const debouncedQueue: ServiceEventsDebouncedQueue = {
    addOrUpdateById: {},
    removeItemById: {},
    enqueueAddOrUpdate(item): void {
      const id = getId(item, options.idField)
      this.addOrUpdateById[id] = item
      if (hasOwn(this.removeItemById, id)) {
        delete this.removeItemById[id]
      }
      this.flushAddOrUpdateQueue()
    },
    enqueueRemoval(item): void {
      const id = getId(item, options.idField)
      this.removeItemById[id] = item
      if (hasOwn(this.addOrUpdateById, id)) {
        delete this.addOrUpdateById[id]
      }
      this.flushRemoveItemQueue()
    },
    flushAddOrUpdateQueue: _debounce(
      async function () {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error todo
        const values = Object.values(this.addOrUpdateById)
        if (values.length === 0) return
        await store.addOrUpdate(values)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error todo
        this.addOrUpdateById = {}
      },
      options.debounceEventsTime || 20,
      { maxWait: options.debounceEventsMaxWait },
    ),
    flushRemoveItemQueue: _debounce(
      function () {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error todo
        const values = Object.values(this.removeItemById)
        if (values.length === 0) return
        store.removeFromStore(values)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error todo
        this.removeItemById = {}
      },
      options.debounceEventsTime || 20,
      { maxWait: options.debounceEventsMaxWait },
    ),
  }

  const handleEvent = (eventName: HandledEvents, item: any): void => {
    const handler = options.handleEvents[eventName]
    const confirmOrArray = handler(item, { model: Model, models })
    const [affectsStore, modified = item] = Array.isArray(confirmOrArray)
      ? confirmOrArray
      : [confirmOrArray]
    if (affectsStore) {
      if (!options.debounceEventsTime) {
        eventName === 'removed' 
          ? store.removeFromStore(modified) 
          : store.addOrUpdate(modified)
      } else {
        eventName === 'removed'
          ? debouncedQueue.enqueueRemoval(item)
          : debouncedQueue.enqueueAddOrUpdate(item)
      }
    }
  }

  // Listen to socket events when available.
  service.on('created', (item: any) => {
    handleEvent('created', item)
    Model.emit && Model.emit('created', item)
  })
  service.on('updated', (item: any) => {
    handleEvent('updated', item)
    Model.emit && Model.emit('updated', item)
  })
  service.on('patched', (item: any) => {
    handleEvent('patched', item)
    Model.emit && Model.emit('patched', item)
  })
  service.on('removed', (item: any) => {
    handleEvent('removed', item)
    Model.emit && Model.emit('removed', item)
  })

  return debouncedQueue
}
