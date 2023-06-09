import type { AnyData } from '../types.js'

/**
 * Defines all provided properties as non-enumerable, configurable, values
 */
export const defineValues = <M extends AnyData, D extends AnyData>(
  data: M,
  properties: D
) => {
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
export const defineGetters = <M extends AnyData, D extends AnyData>(
  data: M,
  properties: D
) => {
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
export const defineSetters = <M extends AnyData, D extends AnyData>(
  data: M,
  properties: D
) => {
  Object.keys(properties).forEach((key) => {
    Object.defineProperty(data, key, {
      enumerable: false,
      configurable: true,
      set: properties[key],
    })
  })
  return data
}
