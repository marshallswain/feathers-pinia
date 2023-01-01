import { HookContext, Id, NextFunction } from '@feathersjs/feathers'
import { getQueryInfo } from '../utils'

export const handleFindSsr = (store: any) => async (context: HookContext, next: NextFunction) => {
  if (context.method === 'find') {
    const { params } = context
    const info = getQueryInfo(params, {})
    const qidData = store.pagination[info.qid]
    const queryData = qidData?.[info.queryId]
    const pageData = queryData?.[info.pageId as string]

    if (pageData?.ssr) {
      context.result = {
        data: pageData.ids.map((id: Id) => store.getFromStore(id)),
        limit: pageData.pageParams.$limit,
        skip: pageData.pageParams.$skip,
        total: queryData.total,
        fromSsr: true,
      }
      if (!params.preserveSsr) {
        store.unflagSsr(params)
      }
    }
  }

  if (next) await next()
}
