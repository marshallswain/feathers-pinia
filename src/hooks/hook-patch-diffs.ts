import { HookContext, NextFunction } from '@feathersjs/feathers'
import { diff, pickDiff } from '../utils'
import fastCopy from 'fast-copy'

export const patchDiffing = (Model: any) => async (context: HookContext, next: NextFunction) => {
  const { method, data, params, id } = context
  let rollbackData: any
  let clone: any
  const shouldRun = method === 'patch' && data.__isClone && params.diff !== false && !params.data

  if (shouldRun) {
    clone = data
    const original = Model.store.getFromStore(id)
    const diffedData = diff(original, clone, params.diff)
    rollbackData = fastCopy(original)

    // Do eager updating.
    if (params.eager !== false) {
      data.commit(diffedData)
    }

    // Always include matching values from `params.with`.
    if (params.with) {
      const dataFromWith = pickDiff(clone, params.with)
      // If params.with was an object, merge the values into dataFromWith
      if (typeof params.with !== 'string' && !Array.isArray(params.with)) {
        Object.assign(dataFromWith, params.with)
      }
      Object.assign(diffedData, dataFromWith)
    }

    context.data = diffedData

    // If diff is empty, return the clone without making a request.
    if (Object.keys(data).length === 0) {
      context.result = clone
    }
  } else {
    context.data = fastCopy(data)
  }

  try {
    await next()
  } catch (error) {
    if (shouldRun) {
      // If saving fails, reverse the eager update
      clone && clone.commit(rollbackData)
    } else {
      throw error
    }
  }
}
