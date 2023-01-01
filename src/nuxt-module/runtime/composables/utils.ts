import { reactive } from 'vue'
import { useNuxtApp } from '#app'

/**
 * Sets up a reactive namespace for the Model name that tracks setup completion for that Model
 * and store.  Returns the namespace.
 *
 * @param name the model name
 */
export const getModelNamespace = (name: string) => {
  const { $fp } = useNuxtApp()
  if (!name)
    throw new Error('name is required')

  let ns = $fp.models[name]
  if (!ns) {
    $fp.models[name] = reactive({ model: null, store: null, ready: false, final: false })
    ns = $fp.models[name]
  }
  return ns
}
