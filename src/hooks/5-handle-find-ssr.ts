import type { HookContext, Id, NextFunction } from '@feathersjs/feathers'
import { getQueryInfo } from '../utils'

/**
 * Assures that the client reuses SSR-provided data instead of re-making the same query.
 *
 * Checks the `store.pagination` object to see if a query's results came from SSR-provided data.
 * If the data was from SSR, the SSR'd data is used and then set to `fromSSR = false` to allow
 * normal queries to happen again.
 */
export function handleFindSsr() {
  return async (context: HookContext, next: NextFunction) => {
    const store = context.service.store

    if (context.method === 'find') {
      const { params } = context
      const info = getQueryInfo(params)
      const qidData = store.pagination[info.qid]
      const queryData = qidData?.[info.queryId]
      const pageData = queryData?.[info.pageId as string]

      if (pageData?.ssr) {
        context.result = {
          data: pageData.ids.map((id: Id) => store.getFromStore(id).value),
          limit: pageData.pageParams.$limit,
          skip: pageData.pageParams.$skip,
          total: queryData.total,
          fromSsr: true,
        }
        if (!params.preserveSsr)
          store.unflagSsr(params)
      }
    }

    if (next)
      await next()
  }
}
