import { ref, reactive, watch } from 'vue'

export interface ModelNamespace {
  model: any
  store: any
  ready: boolean
  final: boolean
}
export interface FpModelStorage {
  models: Record<string, ModelNamespace>
}

export type FpSpaStorageFn = () => FpModelStorage

const default$fp = { models: {} }
const defaultFpFn: FpSpaStorageFn = () => default$fp

const fpFn = ref<FpSpaStorageFn>(defaultFpFn)
const getFp = () => fpFn.value()

/**
 * Allows setting the Feathers Pinia SPA Model state to something other than an internal global context.
 */
export const setFeathersPiniaSpaState = (fn: FpSpaStorageFn) => (fpFn.value = fn)

/**
 * Sets up a reactive namespace for the Model name that tracks setup completion for that Model
 * and store.  Returns the namespace.
 *
 * @param name the model name
 */
export const getModelNamespace = (name: string) => {
  if (!name) throw new Error('name is required')

  const $fp = getFp()
  let ns = $fp.models[name]
  if (!ns) {
    $fp.models[name] = reactive({ model: null, store: null, ready: false, final: false })
    ns = $fp.models[name]
  }
  return ns
}

/**
 * Assures that a Model Function is only created once, no matter how many times you call the
 * composable function that contains it.
 *
 * @param name the name of the Model
 * @param modelFn the model function
 */
export const useModel = <B extends () => any>(name: string, modelFn: B): ReturnType<B> => {
  const ns = getModelNamespace(name)
  if (!ns.model) ns.model = modelFn()

  return ns.model
}

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

  if (ns.ready) return

  ns.model = ns.model || getModel()
  ns.store = ns.store || getStore()

  if (ns.model !== true && ns.store !== true) ns.model.setStore(ns.store)

  ns.ready = true
}

/**
 * Runs some logic after model and store are connected. This is useful to prevent setting up
 * hooks more than once, for example.
 *
 * @param name the model name
 * @param cb the callback function
 */
export const onModelReady = (name: string, cb: () => void) => {
  const ns = getModelNamespace(name)
  watch(
    () => ns,
    () => {
      if (ns.ready && !ns.final) {
        ns.final = true
        cb()
      }
    },
    { immediate: true },
  )
}
