import { watch } from 'vue'
import { getModelNamespace } from './utils'

/**
 * Runs some logic after model and store are connected. This is useful to prevent setting up
 * hooks more than once, for example.
 *
 * @param name the model name
 * @param cb the callback function
 */
export const onModelReady = (name: string, cb: () => void) => {
  const ns = getModelNamespace(name)
  const stop = watch(() => ns, () => {
    if (ns.ready && !ns.final) {
      stop()
      ns.final = true
      cb()
    }
  }, { immediate: true })
}
