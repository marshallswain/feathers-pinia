import type { FeathersService } from '@feathersjs/feathers'
import type { HandleEvents, HandledEvents } from './types'
import type { AnyData } from '../types'
import { del, ref, set } from 'vue-demi'
import { getId, hasOwn } from '../utils'
import _debounce from 'just-debounce'

interface UseServiceStoreEventsOptions<M extends AnyData> {
  service: FeathersService
  getModel: () => (data: AnyData) => any
  idField: string
  debounceEventsTime?: number
  onAddOrUpdate: (item: any) => void
  onRemove: (item: any) => void
  debounceEventsGuarantee?: boolean
  handleEvents?: HandleEvents<M>
  toggleEventLock: any
  eventLocks: any
}

export const useServiceEvents = <M extends AnyData>(options: UseServiceStoreEventsOptions<M>) => {
  if (!options.service || options.handleEvents === false) return

  const service = options.service

  const addOrUpdateById = ref({})
  const removeItemsById = ref({})

  const flushAddOrUpdateQueue = _debounce(
    async () => {
      const values = Object.values(addOrUpdateById.value)
      if (values.length === 0) return
      options.onAddOrUpdate(values)
      addOrUpdateById.value = {}
    },
    options.debounceEventsTime || 20,
    undefined,
    options.debounceEventsGuarantee,
  )

  function enqueueAddOrUpdate(item: any) {
    const id = getId(item, options.idField)
    if (!id) return

    set(addOrUpdateById, id, item)

    if (hasOwn(removeItemsById.value, id)) del(removeItemsById, id)

    flushAddOrUpdateQueue()
  }

  const flushRemoveItemQueue = _debounce(
    () => {
      const values = Object.values(removeItemsById.value)
      if (values.length === 0) return
      options.onRemove(values)
      removeItemsById.value = {}
    },
    options.debounceEventsTime || 20,
    undefined,
    options.debounceEventsGuarantee,
  )

  function enqueueRemoval(item: any) {
    const id = getId(item, options.idField)
    if (!id) return

    set(removeItemsById, id, item)

    if (hasOwn(addOrUpdateById.value, id)) del(addOrUpdateById.value, id)

    flushRemoveItemQueue()
  }

  function handleEvent(eventName: HandledEvents, item: any) {
    const handler = (options.handleEvents as any)?.[eventName]
    if (handler === false) return

    /**
     * For `created` events, we don't know the id since it gets assigned on the server. Also, since `created` events
     * arrive before the `create` response, we only act on other events. For all other events, toggle the event lock.
     */
    const id = getId(item, options.idField)
    if (eventName !== 'created' && options.eventLocks[eventName][id]) {
      options.toggleEventLock(id, eventName)
      return
    }

    if (handler) {
      const Model = options.getModel()
      const handled = handler(item, { model: Model })
      if (!handled) return
    }

    if (!options.debounceEventsTime) eventName === 'removed' ? options.onRemove(item) : options.onAddOrUpdate(item)
    else eventName === 'removed' ? enqueueRemoval(item) : enqueueAddOrUpdate(item)
  }

  // Listen to socket events when available.
  service.on('created', (item: any) => {
    // const Model = options.getModel() as Func & EventEmitter
    // const instance = Model(item)
    // handleEvent('created', instance)
    handleEvent('created', item)
    // Model?.emit && Model.emit('created', instance)
  })
  service.on('updated', (item: any) => {
    // const Model = options.getModel() as Func & EventEmitter
    // const instance = Model(item)
    // handleEvent('updated', instance)
    handleEvent('updated', item)
    // Model?.emit && Model.emit('updated', instance)
  })
  service.on('patched', (item: any) => {
    // const Model = options.getModel() as Func & EventEmitter
    // const instance = Model(item)
    // handleEvent('patched', instance)
    handleEvent('patched', item)
    // Model?.emit && Model.emit('patched', instance)
  })
  service.on('removed', (item: any) => {
    // const Model = options.getModel() as Func & EventEmitter
    // const instance = Model(item)
    // handleEvent('removed', instance)
    handleEvent('removed', item)
    // Model?.emit && Model.emit('removed', instance)
  })
}
