import type { HookContext, NextFunction } from '@feathersjs/feathers'

export function eventLocks() {
  return async (context: HookContext, next: NextFunction) => {
    const { id, method } = context
    const store = context.service.store
    const isLockableMethod = ['update', 'patch', 'remove'].includes(method)
    const eventNames: any = {
      update: 'updated',
      patch: 'patched',
      remove: 'removed',
    }
    const eventName = eventNames[method]

    if (isLockableMethod && id && !store.isSsr)
      store.toggleEventLock(id, eventName)

    await next()

    if (isLockableMethod && id && !store.isSsr)
      store.clearEventLock(id, eventName)
  }
}
