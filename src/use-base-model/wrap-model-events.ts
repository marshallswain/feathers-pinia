import EventEmitter from 'events'

/**
 * Upgrades the ModelFn to be an EventEmitter by using old-school prototype patching
 * @param ModelFn
 * @returns ModelFn as EventEmitter
 */
export const useModelEvents = <F>(ModelFn: F) => {
  const _ModelFn: any = ModelFn
  _ModelFn.prototype = Object.create(EventEmitter.prototype)
  return ModelFn as F & EventEmitter
}
