import { HookContext, NextFunction } from '@feathersjs/feathers'

export const eventLocks = (Model: any) => async (context: HookContext, next: NextFunction) => {
  const { store } = Model
  const { id, method } = context
  const isLockableMethod = ['update', 'patch', 'remove'].includes(method)
  const eventNames: any = {
    update: 'updated',
    patch: 'patched',
    remove: 'removed',
  }
  const eventName = eventNames[method]

  if (isLockableMethod && id) {
    store.toggleEventLock(id, eventName)
  }

  // try {
  await next()
  // } catch (error) {
  //   store.clearEventLock(id, eventName)
  //   throw error
  // }

  if (isLockableMethod && id) {
    store.clearEventLock(id, eventName)
  }
}
