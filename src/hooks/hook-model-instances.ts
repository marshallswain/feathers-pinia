import { HookContext, NextFunction } from '@feathersjs/feathers'
import { AnyData } from '../use-service'

export const makeModelInstances =
  <M extends AnyData>(Model: (data: any) => M) =>
  async (context: HookContext, next: NextFunction) => {
    if (next) await next()
    if (Array.isArray(context.result?.data)) {
      context.result.data = context.result.data.map((i: M) => Model(i))
    } else if (Array.isArray(context.result)) {
      context.result = context.result.map((i: M) => Model(i))
    } else {
      context.result = Model(context.result)
    }
  }
