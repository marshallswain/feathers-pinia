import type { FeathersService } from '@feathersjs/feathers'
import type { HandleEvents, HandledEvents } from './types'
import type { AnyData } from '../types'
import { del, ref, set } from 'vue-demi'
import { convertData, getId, hasOwn } from '../utils'
import _debounce from 'just-debounce'
import type { PiniaService } from '../create-pinia-service'

interface UseServiceStoreEventsOptions<M extends AnyData> {
  service: PiniaService<FeathersService>
  debounceEventsTime?: number
  debounceEventsGuarantee?: boolean
  handleEvents?: HandleEvents<M>
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
      service.store.createInStore(values)
      addOrUpdateById.value = {}
    },
    options.debounceEventsTime || 20,
    undefined,
    options.debounceEventsGuarantee,
  )

  function enqueueAddOrUpdate(item: any) {
    const id = getId(item, service.store.idField)
    if (!id) return

    set(addOrUpdateById, id, item)

    if (hasOwn(removeItemsById.value, id)) del(removeItemsById, id)

    flushAddOrUpdateQueue()
  }

  const flushRemoveItemQueue = _debounce(
    () => {
      const values = Object.values(removeItemsById.value)
      if (values.length === 0) return
      service.store.removeFromStore(values)
      removeItemsById.value = {}
    },
    options.debounceEventsTime || 20,
    undefined,
    options.debounceEventsGuarantee,
  )

  function enqueueRemoval(item: any) {
    const id = getId(item, service.store.idField)
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
    const id = getId(item, service.store.idField)
    if (eventName !== 'created' && service.store.eventLocks[eventName][id]) {
      service.store.toggleEventLock(id, eventName)
      return
    }

    if (handler) {
      const handled = handler(item, { service })
      if (!handled) return
    }

    if (!options.debounceEventsTime)
      eventName === 'removed' ? service.store.removeFromStore(item) : service.store.createInStore(item)
    else eventName === 'removed' ? enqueueRemoval(item) : enqueueAddOrUpdate(item)
  }

  // Listen to socket events when available.
  service.on('created', (item: any) => {
    const data = convertData(service, item)
    handleEvent('created', data)
  })
  service.on('updated', (item: any) => {
    const data = convertData(service, item)
    handleEvent('updated', data)
  })
  service.on('patched', (item: any) => {
    const data = convertData(service, item)
    handleEvent('patched', data)
  })
  service.on('removed', (item: any) => {
    const data = convertData(service, item)
    handleEvent('removed', data)
  })
}
