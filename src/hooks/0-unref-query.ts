import type { HookContext, NextFunction } from '@feathersjs/feathers'
import { deepUnref } from '../utils'

/**
 * deeply unrefs `params.query`
 */
export const unrefQuery = () => async (context: HookContext, next: NextFunction) => {
  if (context.params.query) {
    context.params.query = deepUnref(context.params.query)
  }

  await next()
}
