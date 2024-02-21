/**
 * Push data to the store and return the new data.
 */
export function pushToStore<Data>(data: Data, service: { createInStore: any }) {
  if (!data)
    return data

  const createInStore = (item: any) => service.createInStore(item)

  if (Array.isArray(data))
    return data.map(createInStore)

  else
    return createInStore(data)
}

/**
 * Define a virtual property on an object.
 */
export function defineVirtualProperty<Data>(data: Data, key: string, getter: any) {
  const definition: any = { enumerable: false }
  if (typeof getter === 'function') {
    definition.get = function get(this: Data) {
      return getter(this as Data)
    }
  }
  else { definition.value = getter }

  Object.defineProperty(data, key, definition)
}

export function defineVirtualProperties<Data>(data: Data, getters: Record<string, any>) {
  Object.keys(getters).forEach(key => defineVirtualProperty(data, key, getters[key]))
}
