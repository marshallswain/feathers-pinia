import type { HookContext, NextFunction } from '@feathersjs/feathers'

/**
 * Prevents duplicate requests by cacheing results from qid-enabled queries.
 * Clears the cache on the client after 500ms.
 */
export function handleQidCache() {
  return async (context: HookContext, next: NextFunction) => {
    const { params } = context
    const store = context.service.store

    // Reuse any cached results for the same qid
    // this prevents duplicate requests on the server and client.
    // The client will cache the result for 500ms. It is assumed that all startup
    // requests will be completed within 500ms.
    if (params.qid) {
      const cached = store.getQid(params.qid)

      // specifically check for undefined because null is a valid value
      if (cached !== undefined) {
        // on the client, schedule the value to be removed from the cache after 500ms
        if (!store.isSsr) {
          setTimeout(() => {
            store.clearQid(params.qid)
          }, 500)
        }

        // set the result to prevent the request
        context.result = cached
        return await next()
      }
    }

    await next()

    // on the ssr server, cache the result if params.qid is set
    if (params.qid && store.isSsr)
      store.setQid(params.qid, context.result)
  }
}
