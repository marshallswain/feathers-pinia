import type { HookContext, NextFunction } from '@feathersjs/feathers'

/**
 * Controls pending state
 */
export const setPending = () => async (context: HookContext, next: NextFunction) => {
  const store = context.service.store
  let unsetPending

  if (!store.isSsr) {
    const method = context.method === 'find' ? (context.params.query?.$limit === 0 ? 'count' : 'find') : context.method

    store.setPending(method, true)
    if (context.id != null && method !== 'get')
      store.setPendingById(context.id, method, true)

    const isTemp = context.data?.__isTemp
    const tempId = context.data?.__tempId
    if (isTemp && method === 'create')
      store.setPendingById(context.data.__tempId, method, true)

    unsetPending = () => {
      store.setPending(method, false)
      const id = context.id != null ? context.id : tempId
      if (id != null && method !== 'get')
        store.setPendingById(id, method, false)
    }
  }

  try {
    await next()
  }
  catch (error) {
    if (unsetPending)
      unsetPending()

    throw error
  }

  if (unsetPending)
    unsetPending()
}
