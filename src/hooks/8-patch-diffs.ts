import type { HookContext, NextFunction } from '@feathersjs/feathers'
import fastCopy from 'fast-copy'
import { diff, pickDiff } from '../utils/index.js'

export const patchDiffing =
  () => async (context: HookContext, next: NextFunction) => {
    const { method, data, params, id } = context
    const store = context.service.store

    let rollbackData: any
    let clone: any
    const shouldDiff =
      method === 'patch' && !params.data && (data.__isClone || params.diff)

    if (shouldDiff) {
      clone = data
      const original = store.getFromStore(id).value
      const diffedData = diff(original, clone, params.diff)
      rollbackData = fastCopy(original)

      // Do eager updating.
      if (params.eager !== false) data.commit(diffedData)

      // Always include matching values from `params.with`.
      if (params.with) {
        const dataFromWith = pickDiff(clone, params.with)
        // If params.with was an object, merge the values into dataFromWith
        if (typeof params.with !== 'string' && !Array.isArray(params.with))
          Object.assign(dataFromWith, params.with)

        Object.assign(diffedData, dataFromWith)
      }

      context.data = diffedData

      // If diff is empty, return the clone without making a request.
      if (Object.keys(context.data).length === 0) context.result = clone
    } else {
      context.data = fastCopy(data)
    }

    try {
      await next()
    } catch (error) {
      if (shouldDiff) {
        // If saving fails, reverse the eager update
        clone && clone.commit(rollbackData)
      }
      throw error
    }
  }
