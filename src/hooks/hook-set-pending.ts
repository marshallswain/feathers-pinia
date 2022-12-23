import { HookContext, NextFunction } from '@feathersjs/feathers'

export const setPending = (Model: any) => async (context: HookContext, next: NextFunction) => {
  const { store } = Model
  const method = context.method === 'find' ? (context.params.query?.$limit === 0 ? 'count' : 'find') : context.method

  store.setPending(method, true)
  if (context.id != null && method !== 'get') {
    store.setPendingById(context.id, method, true)
  }
  const isTemp = context.data?.__isTemp
  const tempId = context.data?.__tempId
  if (isTemp && method === 'create') {
    store.setPendingById(context.data.__tempId, method, true)
  }

  const unsetPending = () => {
    store.setPending(method, false)
    const id = context.id != null ? context.id : tempId
    if (id != null && method !== 'get') {
      store.setPendingById(id, method, false)
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
