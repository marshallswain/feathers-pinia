import { computed, reactive, ref, toRefs, watchEffect } from 'vue-demi'
import { BaseModel } from './service-store'
import { UseCloneOptions } from './service-store/types'
import { AnyRef } from './types'

export function useClone<M extends BaseModel>(
  props: any,
  attr: string,
  options: UseCloneOptions = {},
): AnyRef<M | null> {
  const { useExisting = false, deep = false } = options

  const returnVal = deep ? computed(handleClone) : ref(null)

  function handleClone(): M | null {
    // Return null if not a BaseModel
    const val = props[attr]
    if (!(val instanceof BaseModel)) return null

    // Assure that instance is in the store.
    const instance = val as M
    const anyId = instance.getAnyId()
    const inStore = instance.Model.getFromStore(anyId)
    if (!inStore) instance.addToStore()

    if (instance) return instance?.clone(undefined, { useExisting }) as M
    else return null
  }

  let cachedId: any = null

  if (!deep) {
    watchEffect(() => {
      toRefs(reactive(props))
      const val = props[attr]
      if (!val) {
        cachedId = null
        ;(returnVal.value as any) = null
      } else if (val.getAnyId) {
        const id = val.getAnyId()
        if (id !== cachedId) {
          cachedId = id
          ;(returnVal.value as any) = handleClone()
        }
      }
    })
  }

  return returnVal
}
