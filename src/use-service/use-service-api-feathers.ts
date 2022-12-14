import type { Id, NullableId, Query, ClientService } from '@feathersjs/feathers'
import type { Params } from '../types'
import type { MaybeRef } from '../utility-types'
import type {
  AnyData,
  AnyDataOrArray,
  // FindResponseAlwaysData
} from './types'
import { cleanData, getSaveParams } from '../utils'
import { FeathersInstance } from '../use-base-model'

interface UseServiceFeathersOptions<M extends AnyData, D extends AnyData, Q extends Query> {
  service: ClientService<FeathersInstance<M, Q>, D, Params<Q>>
}

export const useServiceApiFeathers = <M extends AnyData, D extends AnyData, Q extends Query>(
  options: UseServiceFeathersOptions<M, D, Q>,
) => {
  const { service } = options

  async function find(_params?: MaybeRef<Params<Q>>) {
    const params = getSaveParams(_params)
    const result = await service.find(params as Params<Q>)
    // as FindResponseAlwaysData<N>
    return result
  }

  async function count(_params?: MaybeRef<Params<Q>>) {
    const params = getSaveParams(_params)
    params.query = params.query || {}
    params.query.$limit = 0
    return await service.find(params as Params<Q>)
  }

  async function get(id: Id, _params?: MaybeRef<Params<Q>>) {
    const params = getSaveParams(_params) as Params<Q>
    return await service.get(id, params)
  }

  async function create(data: D, _params?: MaybeRef<Params<Q>>): Promise<FeathersInstance<M, Q>>
  async function create(data: D[], _params?: MaybeRef<Params<Q>>): Promise<FeathersInstance<M, Q>[]>
  async function create(
    data: AnyDataOrArray<D>,
    _params?: MaybeRef<Params<Q>>,
  ): Promise<AnyDataOrArray<FeathersInstance<M, Q>>> {
    const params = getSaveParams(_params) as Params<Q>
    return service.create(data as any, params)
  }

  async function update(
    id: Id | undefined,
    data: AnyData,
    _params?: MaybeRef<Params<Q>>,
  ): Promise<FeathersInstance<M, Q>> {
    const params = getSaveParams(_params)
    return service.update(id as any, cleanData(data as any, '__tempId'), params as Params<Q>) as unknown as Promise<
      FeathersInstance<M, Q>
    >
  }

  async function patch(id: Id, data: AnyData, _params?: MaybeRef<Params<Q>>): Promise<FeathersInstance<M, Q>>
  async function patch(id: null, data: AnyData, _params?: MaybeRef<Params<Q>>): Promise<FeathersInstance<M, Q>[]>
  async function patch(id: NullableId, data: AnyData, _params?: MaybeRef<Params<Q>>) {
    const params = getSaveParams(_params)
    return service.patch(id, data as any, params as Params<Q>)
  }

  async function remove(id: Id, _params?: MaybeRef<Params<Q>>): Promise<FeathersInstance<M, Q>>
  async function remove(id: null, _params?: MaybeRef<Params<Q>>): Promise<FeathersInstance<M, Q>[]>
  async function remove(
    id: NullableId,
    _params?: MaybeRef<Params<Q>>,
  ): Promise<FeathersInstance<M, Q> | FeathersInstance<M, Q>[]> {
    const params = getSaveParams(_params)
    return service.remove(id, params as Params<Q>)
  }

  return { find, count, get, create, update, patch, remove }
}
