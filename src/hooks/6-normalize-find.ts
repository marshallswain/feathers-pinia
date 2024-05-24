import type { HookContext, NextFunction } from '@feathersjs/feathers'
import { hasOwn } from '../utils/index.js'

/**
 * Normalizes two things
 *  - pagination across all adapters, including @feathersjs/memory
 *  - the find response so that it always holds data at `response.data`
 * @returns { data: AnyData[] }
 */
export function normalizeFind() {
  return async (context: HookContext, next?: NextFunction) => {
  // Client-side services, like feathers-memory, require paginate.default to be truthy.
    if (context.method === 'find') {
      const { params } = context
      const { query = {} } = params
      const isPaginated = params.paginate === true || hasOwn(query, '$limit') || hasOwn(query, '$skip')
      if (isPaginated)
        params.paginate = { default: true }
    }

    next && await next()

    // this makes sure it only affects finds that are not paginated and are not custom.
    // so the custom find responses fall through.
    if (context.method === 'find' && !context.result?.data && Array.isArray(context.result)) {
      context.result = {
        data: context.result,
        limit: context.params.$limit || context.result.length,
        skip: context.params.$skip || 0,
        total: context.result.length,
      }
    }
  }
}
