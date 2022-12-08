import type { HandledEvents, HandleEvents } from './types'
import type { ModelFnType } from '../use-base-model'
import { getId, hasOwn } from '../utils'
import { del, ref, set } from 'vue-demi'
import _debounce from 'just-debounce'
import EventEmitter from 'events'

type UseServiceStoreEventsOptions<M extends Record<string, any>> = {
  service: any
  ModelFn?: ModelFnType<M> & EventEmitter
  idField: string
  debounceEventsTime?: number
  onAddOrUpdate: (item: any) => void
  onRemove: (item: any) => void
  debounceEventsGuarantee?: boolean
  handleEvents?: HandleEvents<M>
  toggleEventLock: any
  eventLocks: any
}

export const useServiceEvents = <C extends Record<string, any>>(options: UseServiceStoreEventsOptions<C>) => {
  if (!options.service || options.handleEvents === false) {
    return
  }

  const addOrUpdateById = ref({})
  const removeItemsById = ref({})

  function enqueueAddOrUpdate(item: any) {
    const id = getId(item, options.idField)
    if (!id) {
      return
    }

    set(addOrUpdateById, id, item)

    if (hasOwn(removeItemsById.value, id)) {
      del(removeItemsById, id)
    }

    flushAddOrUpdateQueue()
  }

  function enqueueRemoval(item: any) {
    const id = getId(item, options.idField)
    if (!id) {
      return
    }

    set(removeItemsById, id, item)

    if (hasOwn(addOrUpdateById.value, id)) {
      del(addOrUpdateById.value, id)
    }

    flushRemoveItemQueue()
  }

  const flushAddOrUpdateQueue = _debounce(
    async function () {
      const values = Object.values(addOrUpdateById.value)
      if (values.length === 0) return
      options.onAddOrUpdate(values)
      addOrUpdateById.value = {}
    },
    options.debounceEventsTime || 20,
    undefined,
    options.debounceEventsGuarantee,
  )

  const flushRemoveItemQueue = _debounce(
    function () {
      const values = Object.values(removeItemsById.value)
      if (values.length === 0) return
      options.onRemove(values)
      removeItemsById.value = {}
    },
    options.debounceEventsTime || 20,
    undefined,
    options.debounceEventsGuarantee,
  )

  function handleEvent(eventName: HandledEvents, item: any) {
    const handler = (options.handleEvents as any)?.[eventName]
    if (handler === false) {
      return
    }

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
      const handled = handler(item, { model: ModelFn })
      if (!handled) {
        return
      }
    }

    if (!options.debounceEventsTime) {
      eventName === 'removed' ? options.onRemove(item) : options.onAddOrUpdate(item)
    } else {
      eventName === 'removed' ? enqueueRemoval(item) : enqueueAddOrUpdate(item)
    }
  }

  const { ModelFn, service } = options

  // Listen to socket events when available.
  service.on('created', (item: any) => {
    handleEvent('created', item)
    ModelFn?.emit && ModelFn.emit('created', item)
  })
  service.on('updated', (item: any) => {
    handleEvent('updated', item)
    ModelFn?.emit && ModelFn.emit('updated', item)
  })
  service.on('patched', (item: any) => {
    handleEvent('patched', item)
    ModelFn?.emit && ModelFn.emit('patched', item)
  })
  service.on('removed', (item: any) => {
    handleEvent('removed', item)
    ModelFn?.emit && ModelFn.emit('removed', item)
  })
}
