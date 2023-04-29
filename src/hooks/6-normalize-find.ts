import type { HookContext, NextFunction } from '@feathersjs/feathers'
import { hasOwn } from '../utils'

/**
 * Normalizes two things
 *  - pagination across all adapters, including @feathersjs/memory
 *  - the find response so that it always holds data at `response.data`
 * @returns { data: AnyData[] }
 */
export const normalizeFind = () => async (context: HookContext, next?: NextFunction) => {
  // Client-side services, like feathers-memory, require paginate.default to be truthy.
  if (context.method === 'find') {
    const { params } = context
    const { query = {} } = params
    const isPaginated = params.paginate === true || hasOwn(query, '$limit') || hasOwn(query, '$skip')
    if (isPaginated) params.paginate = { default: true }
  }

  if (next) await next()

  if (context.method === 'find' && !context.result.data) {
    // context.result = { data: context.result }
  }
}
