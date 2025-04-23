import type { Id } from '@feathersjs/feathers'
import type { MaybeArray } from '../types.js'
import type { EventLocks, EventName } from './types.js'
import { del, reactive, set } from 'vue-demi'
import { getArray } from '../utils/index.js'

export function useServiceEventLocks() {
  const eventLocks = reactive<EventLocks>({
    created: {},
    patched: {},
    updated: {},
    removed: {},
  })

  function toggleEventLock(data: MaybeArray<Id>, event: EventName) {
    const { items: ids } = getArray(data)
    ids.forEach((id) => {
      const currentLock = eventLocks[event][id]
      if (currentLock) {
        clearEventLock(data, event)
      }
      else {
        set(eventLocks[event], id, true)
        // auto-clear event lock after 250 ms
        setTimeout(() => {
          clearEventLock(data, event)
        }, 250)
      }
    })
  }
  function clearEventLock(data: MaybeArray<Id>, event: EventName) {
    const { items: ids } = getArray(data)
    ids.forEach((id) => {
      del(eventLocks[event], id)
    })
  }
  return { eventLocks, toggleEventLock, clearEventLock }
}
