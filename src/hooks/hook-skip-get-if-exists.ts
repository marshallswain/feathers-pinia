import { HookContext, NextFunction } from '@feathersjs/feathers'

export const skipGetIfExists = (store: any) => async (context: HookContext, next: NextFunction) => {
  const { params, id } = context
  if (context.method === 'get' && id != null) {
    const skipIfExists = params.skipRequestIfExists || store.skipRequestIfExists
    delete params.skipRequestIfExists

    // If the records is already in store, return it
    const existingItem = store.getFromStore(context.id, params)
    if (existingItem && skipIfExists) {
      context.result = existingItem
    }
  }
  await next()
}
