import type { UseGetComputed, UseGetOptionsStandalone, UseGetState } from './service-store/types'
import type { Id } from '@feathersjs/feathers'
import type { Params } from './types'
import { reactive, computed, toRefs, unref, watch } from 'vue-demi'
import { BaseModel } from './service-store'

export function useGetWatched<M extends BaseModel = BaseModel>({
  model,
  id,
  params = computed(() => ({})),
  queryWhen = computed((): boolean => true),
  local = false,
  immediate = true,
}: UseGetOptionsStandalone<M>) {
  if (!model) {
    throw new Error(`No model provided for useGetWatched(). Did you define and register it with FeathersPinia?`)
  }

  function getId() {
    return unref(id)
  }
  function getParams() {
    return unref(params)
  }

  const state = reactive<UseGetState>({
    isPending: false,
    hasBeenRequested: false,
    hasLoaded: false,
    error: null,
    isLocal: local,
    request: null,
  })

  const computes: UseGetComputed<M> = {
    item: computed(() => {
      const unrefId = getId()
      if (unrefId === null) {
        return null
      }
      return (model.getFromStore(unrefId, getParams()) as M) || null
    }),
    servicePath: computed(() => model.servicePath),
    isSsr: computed(() => model.store.isSsr),
  }

  async function get(id: Id | null, params?: Params): Promise<M | undefined | any> {
    const idToUse = unref(id)
    const paramsToUse = unref(params)

    if (idToUse != null && queryWhen.value && !state.isLocal) {
      state.isPending = true
      state.error = null
      state.hasBeenRequested = true

      const request = paramsToUse != null ? model.get(idToUse, paramsToUse) : model.get(idToUse)
      state.request = request

      try {
        const response = await request
        state.isPending = false
        state.hasLoaded = true
        return response
      } catch (error: any) {
        state.isPending = false
        state.error = error
        return error
      }
    } else {
      return Promise.resolve(undefined)
    }
  }

  watch(
    () => [getId(), getParams(), queryWhen.value],
    ([id, params]) => {
      get(id as Id | null, params as Params)
    },
    { immediate },
  )

  // Clear error when an item is found
  watch(
    () => computes.item.value,
    (item) => {
      if (item) {
        state.error = null
      }
    },
  )

  return {
    ...toRefs(state),
    ...computes,
    get,
  }
}
