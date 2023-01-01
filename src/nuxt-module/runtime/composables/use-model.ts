import { getModelNamespace } from './utils'

/**
 * Assures that a Model Function is only created once, no matter how many times you call the
 * composable function that contains it.
 *
 * @param name the name of the Model
 * @param modelFn the model function
 */
export const useModel = <B extends () => any>(name: string, modelFn: B): ReturnType<B> => {
  const ns = getModelNamespace(name)
  if (!ns.model)
    ns.model = modelFn()

  return ns.model
}
