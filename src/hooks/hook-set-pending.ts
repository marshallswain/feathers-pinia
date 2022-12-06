import { HookContext, NextFunction } from '@feathersjs/feathers'

export const setPending = (store: any) => async (context: HookContext, next: NextFunction) => {
  const method = context.method === 'find' ? (context.params.query?.$limit === 0 ? 'count' : 'find') : context.method

  store.setPending(method, true)
  if (context.id && method !== 'get') {
    store.setPendingById(context.id, method, true)
  }

  const unsetPending = () => {
    store.setPending(method, false)
    if (context.id && method !== 'get') {
      store.setPendingById(context.id, method, false)
    }
  }

  try {
    await next()
  } catch (error) {
    unsetPending()
    throw error
  }

  unsetPending()
}
