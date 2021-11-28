import { reactive, computed, toRefs, unref, watch, Ref, ComputedRef } from 'vue-demi'
import { Params } from './types'
import { Model } from './service-store/types'
import { Id } from '@feathersjs/feathers'

interface UseGetOptions {
  model: any
  id: Ref<Id | null> | null
  params?: Ref<Params>
  queryWhen?: Ref<boolean>
  local?: boolean
  immediate?: boolean
}
interface UseGetState {
  isPending: boolean
  hasBeenRequested: boolean
  hasLoaded: boolean
  error: null | Error
  isLocal: boolean
}

interface UseGetComputed {
  item: ComputedRef<any>
  servicePath: ComputedRef<string>
}

export function useGet<M extends Model = Model>({
  model,
  id,
  params = computed(() => ({})),
  queryWhen = computed((): boolean => true),
  local = false,
  immediate = true,
}: UseGetOptions) {
  if (!model) {
    throw new Error(
      `No model provided for useGet(). Did you define and register it with FeathersVuex?`
    )
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
  })

  const computes: UseGetComputed = {
    item: computed(() => model.getFromStore(getId(), getParams()) || null),
    servicePath: computed(() => model.servicePath),
  }

  function get(id: Id | null, params?: Params): Promise<M | undefined | any> {
    const idToUse = unref(id)
    const paramsToUse = unref(params)

    if (idToUse != null && queryWhen.value && !state.isLocal) {
      state.isPending = true
      state.hasBeenRequested = true

      const promise = paramsToUse != null ? model.get(idToUse, paramsToUse) : model.get(idToUse)

      return promise
        .then((response: any) => {
          state.isPending = false
          state.hasLoaded = true
          return response
        })
        .catch((error: any) => {
          state.isPending = false
          state.error = error
          return error
        })
    } else {
      return Promise.resolve(undefined)
    }
  }

  watch(
    () => [getId(), getParams(), queryWhen.value],
    ([id, params]) => {
      get(id as Id | null, params as Params)
    },
    { immediate }
  )

  return {
    ...toRefs(state),
    ...computes,
    get,
  }
}
