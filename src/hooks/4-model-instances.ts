import type { HookContext, NextFunction } from '@feathersjs/feathers'
import type { AnyData } from '../types.js'

export const makeModelInstances = () => {
  return async (context: HookContext, next: NextFunction) => {
    if (next) await next()

    if (context.service.new) {
      if (Array.isArray(context.result?.data))
        context.result.data = context.result.data.map((i: AnyData) =>
          context.service.new(i)
        )
      else if (Array.isArray(context.result))
        context.result = context.result.map((i: AnyData) =>
          context.service.new(i)
        )
      else context.result = context.service.new(context.result)
    }
  }
}
