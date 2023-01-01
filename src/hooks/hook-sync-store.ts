import { HookContext, NextFunction } from '@feathersjs/feathers'
import { restoreTempIds } from '../utils'

export const syncStore = (store: any) => async (context: HookContext, next: NextFunction) => {
  const { method, params } = context

  if (method === 'patch' && params.data) {
    context.data = params.data
  }

  if (next) await next()

  if (!context.params.skipStore) {
    if (method === 'removed') {
      store.removeFromStore(context.result)
    } else if (method === 'create') {
      const restoredTempIds = restoreTempIds(context.data, context.result)
      context.result = store.addToStore(restoredTempIds)
    } else if (method === 'find' && Array.isArray(context.result.data)) {
      context.result.data = store.addToStore(context.result.data)
    } else {
      context.result = store.addToStore(context.result)
    }

    // Update pagination based on the qid
    if (method === 'find' && context.result.total) {
      const { qid = 'default', query, preserveSsr = false } = context.params
      store.updatePaginationForQuery({ qid, response: context.result, query, preserveSsr })
    }
  }
}
