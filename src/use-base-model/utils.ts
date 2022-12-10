import { AnyData } from '../use-service'

/**
 * Defines all provided properties as non-enumerable and configurable
 */
export const defineProperties = <M extends AnyData, D extends AnyData>(data: M, properties: D) => {
  Object.keys(properties).forEach((key) => {
    Object.defineProperty(data, key, {
      enumerable: false,
      configurable: true,
      value: properties[key],
    })
  })
  return data
}
