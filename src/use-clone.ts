import type { UseCloneOptions } from './service-store/types'
import type { AnyRef } from './types'
import type { AnyData } from './use-service'
import type { ModelInstance } from './use-base-model'
import { reactive, ref, toRefs, UnwrapRef, watch, watchEffect } from 'vue-demi'

export function useClone<M extends AnyData>(
  props: any,
  attr: string,
  options: UseCloneOptions = {},
): AnyRef<ModelInstance<M> | null> {
  const { useExisting = false, deep = false } = options

  const getAnyId = (val: ModelInstance<M>) => {
    const _id = val[val.__idField]
    const id = _id != null ? _id : val.__tempId
    return id as number | string
  }

  const returnVal = ref<ModelInstance<M> | null>(null)

  function handleClone() {
    // Return null if not a BaseModel
    const val = props[attr]
    if (!val.__Model) return null

    // Assure that instance is in the store.
    const instance = val as ModelInstance<M>
    const id = getAnyId(instance)
    const inStore = instance.__Model.getFromStore(id)
    if (!inStore) {
      instance.addToStore()
    }

    if (instance) {
      return instance?.clone(undefined, { useExisting }) as UnwrapRef<ModelInstance<M>>
    } else {
      return null
    }
  }

  let cachedId: any = null

  if (deep) {
    watch(
      () => props[attr],
      () => {
        returnVal.value = handleClone()
      },
      { deep, immediate: true },
    )
  } else {
    watchEffect(() => {
      toRefs(reactive(props))
      const val = props[attr]
      if (!val) {
        cachedId = null
        ;(returnVal.value as any) = null
      } else {
        const id = getAnyId(val)
        if (id != null) {
          if (id !== cachedId) {
            cachedId = id
            ;(returnVal.value as any) = handleClone()
          }
        }
      }
    })
  }

  return returnVal
}
