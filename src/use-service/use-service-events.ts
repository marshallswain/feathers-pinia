import type { HandledEvents, HandleEvents } from './types'
import { getId, hasOwn } from '../utils'
import { del, ref, set } from 'vue-demi'
import _debounce from 'just-debounce'

type UseServiceStoreEventsOptions<C extends Record<string, any>> = {
  service: any
  Model: C
  idField: string
  debounceEventsTime?: number
  onAddOrUpdate: (item: any) => void
  onRemove: (item: any) => void
  debounceEventsGuarantee?: boolean
  handleEvents?: HandleEvents
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

    if (handler) {
      const handled = handler(item, { model: Model })
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

  const { Model, service } = options

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
}
