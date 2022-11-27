import type { Params, Service } from '@feathersjs/feathers'

export const useModelFeathers = <S extends Service = Service, P extends Params = Params>(
  data: Record<string, any>,
  service: S
) => {
  const { save, create, patch, remove } = makeMethods<S, P>(service)
  Object.defineProperties(data, {
    save: {
      enumerable: false,
      value: save,
    },
    create: {
      enumerable: false,
      value: create,
    },
    patch: {
      enumerable: false,
      value: patch,
    },
    remove: {
      enumerable: false,
      value: remove,
    },
  })
}

const makeMethods = <S extends Service = Service, P extends Params = Params>(service: S) => {
  const create = (data: Record<string, any>, params: P) => {
    return service.create(data, params)
  }
  const patch = (data: Record<string, any>, params: P) => {
    return service.patch(data.id, data, params)
  }
  const remove = (data: Record<string, any>, params: P) => {
    return service.remove(data.id, params)
  }
  const save = (data: Record<string, any>, params: P) => {
    return service.create(data, params)
  }
  return { save, create, patch, remove }
}
