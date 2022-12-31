import EventEmitter from 'events'

/**
 * Upgrades the Model to be an EventEmitter by using old-school prototype patching
 * @param Model
 * @returns Model as EventEmitter
 */
export const useModelEvents = <F>(Model: F) => {
  const _Model: any = Model
  _Model.prototype = Object.create(EventEmitter.prototype)
  return Model as F & EventEmitter
}
