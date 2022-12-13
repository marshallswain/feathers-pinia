import type { Id, NullableId, Query, Service } from '@feathersjs/feathers'
import type { Params } from '../types'
import type { MaybeRef } from '../utility-types'
import type { AnyData, AnyDataOrArray, FindResponseAlwaysData } from './types'
import { cleanData, getSaveParams } from '../utils'

interface UseServiceFeathersOptions<M extends AnyData, D extends AnyData, Q extends Query> {
  service: Service<M, D, Params<Q>>
  addToStore: any
}

export const useServiceApiFeathers = <M extends AnyData, D extends AnyData, Q extends Query>(
  options: UseServiceFeathersOptions<M, D, Q>,
) => {
  const { service } = options

  async function find(_params?: MaybeRef<Params<Q>>): Promise<FindResponseAlwaysData<M>> {
    const params = getSaveParams(_params)
    return service.find(params as Params<Q>) as any as Promise<FindResponseAlwaysData<M>>
  }

  async function count(_params?: MaybeRef<Params<Q>>) {
    const params = getSaveParams(_params)
    params.query = params.query || {}
    params.query.$limit = 0
    return await service.find(params as Params<Q>)
  }

  async function get(id: Id, _params?: MaybeRef<Params<Q>>): Promise<M> {
    const params = getSaveParams(_params) as Params<Q>
    return await service.get(id, params)
  }

  async function create(data: D, _params?: MaybeRef<Params<Q>>): Promise<D>
  async function create(data: D[], _params?: MaybeRef<Params<Q>>): Promise<D[]>
  async function create(data: AnyDataOrArray<D>, _params?: MaybeRef<Params<Q>>): Promise<AnyDataOrArray<D>> {
    const params = getSaveParams(_params) as Params<Q>
    return service.create(data as any, params) as Promise<typeof data>
  }

  async function update(id: Id, data: AnyData, _params?: MaybeRef<Params<Q>>) {
    const params = getSaveParams(_params)
    return service.update(id, cleanData(data as any, '__tempId'), params as Params<Q>)
  }

  async function patch(id: Id, data: AnyData, _params?: MaybeRef<Params<Q>>): Promise<AnyData>
  async function patch(id: null, data: AnyData, _params?: MaybeRef<Params<Q>>): Promise<AnyData[]>
  async function patch(id: NullableId, data: AnyData, _params?: MaybeRef<Params<Q>>): Promise<AnyData | AnyData[]> {
    const params = getSaveParams(_params)
    return service.patch(id, data as any, params as Params<Q>)
  }

  async function remove(id: Id, _params?: MaybeRef<Params<Q>>): Promise<M>
  async function remove(id: null, _params?: MaybeRef<Params<Q>>): Promise<M[]>
  async function remove(id: NullableId, _params?: MaybeRef<Params<Q>>): Promise<M | M[]> {
    const params = getSaveParams(_params)
    return service.remove(id, params as Params<Q>)
  }

  return { find, count, get, create, update, patch, remove }
}
