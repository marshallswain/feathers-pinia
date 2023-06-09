import type { HookContext, NextFunction } from '@feathersjs/feathers'
import { restoreTempIds } from '../utils/index.js'

export const syncStore =
  () => async (context: HookContext, next: NextFunction) => {
    const { method, params } = context
    const store = context.service.store

    if (method === 'patch' && params.data) context.data = params.data

    if (next) await next()

    if (!context.params.skipStore) {
      if (method === 'remove') {
        store.removeFromStore(context.result)
      } else if (method === 'create') {
        const restoredTempIds = restoreTempIds(context.data, context.result)
        context.result = store.createInStore(restoredTempIds)
      } else if (method === 'find' && Array.isArray(context.result.data)) {
        context.result.data = store.createInStore(context.result.data)
      } else {
        context.result = store.createInStore(context.result)
      }

      // Update pagination based on the qid
      if (method === 'find' && context.result.total) {
        const { qid = 'default', query, preserveSsr = false } = context.params
        store.updatePaginationForQuery({
          qid,
          response: context.result,
          query,
          preserveSsr,
        })
      }
    }
  }
