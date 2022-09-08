import type { UseCloneOptions } from './service-store/types'
import { reactive, toRefs } from 'vue-demi'
import { useClone } from './use-clone'

/**
 * Pass in a `props` object and get back an object of clones.
 */
export function useClones<P extends Record<string, unknown>>(props: P, options: UseCloneOptions = {}) {
  const clones: Record<keyof P, any> = reactive({} as Record<keyof P, any>)
  Object.keys(props).forEach((key: keyof P) => {
    clones[key] = useClone(props, key as string, options)
  })
  return toRefs(clones)
}
