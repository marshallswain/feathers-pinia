import { getModelNamespace } from './utils'

/**
 * Connects the Model to the store when they are ready. This function allows the store to stay
 * in the stores folder and the model to be in its own folder, which is cleaner architecture
 * than if we were to mix them. If either the `getModel` or `getStore` function returns `false`
 * then the `model` or `store` will be marked as not needed, which will allow the `onModelReady`
 * callback to run.
 *
 * @param name the model name
 * @param getModel a function that returns the model.
 * @param getStore a function that returns the store
 */
export const connectModel = (name: string, getModel: () => void, getStore: () => void) => {
  const ns = getModelNamespace(name)

  if (ns.ready)
    return

  ns.model = ns.model || getModel() || true
  ns.store = ns.store || getStore() || true

  if (ns.model !== true && ns.store !== true)
    ns.model.setStore(ns.store)

  ns.ready = true
}
