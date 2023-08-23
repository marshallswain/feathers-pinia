import type { AnyData } from '../types.js'

/**
 * Defines all provided properties as non-enumerable, configurable, values
 */
export function defineValues<M extends AnyData, D extends AnyData>(data: M, properties: D) {
  Object.keys(properties).forEach((key) => {
    Object.defineProperty(data, key, {
      enumerable: false,
      configurable: true,
      value: properties[key],
    })
  })
  return data
}

/**
 * Defines all provided properties as non-enumerable, configurable, getters
 */
export function defineGetters<M extends AnyData, D extends AnyData>(data: M, properties: D) {
  Object.keys(properties).forEach((key) => {
    Object.defineProperty(data, key, {
      enumerable: false,
      configurable: true,
      get: properties[key],
    })
  })
  return data
}

/**
 * Defines all provided properties as non-enumerable, configurable, setters
 */
export function defineSetters<M extends AnyData, D extends AnyData>(data: M, properties: D) {
  Object.keys(properties).forEach((key) => {
    // eslint-disable-next-line accessor-pairs
    Object.defineProperty(data, key, {
      enumerable: false,
      configurable: true,
      set: properties[key],
    })
  })
  return data
}
