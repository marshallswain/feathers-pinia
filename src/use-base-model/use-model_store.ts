/**
 * Adds the pinia store instance to the ModelFn as ModelFn.store
 * @param ModelFn
 * @returns ModelFn as EventEmitter
 */
export const useModelStore = <F, S>(ModelFn: F, store: S) => {
  Object.defineProperty(ModelFn, 'store', {
    value: store,
  })
  return ModelFn as F & { store: S }
}
