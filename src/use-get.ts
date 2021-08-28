import { reactive, computed, toRefs, isRef, unref, watch, Ref } from 'vue'
import { Params } from './types'
import { Model } from './service-store/types'
import { Id } from '@feathersjs/feathers'

interface UseGetOptions {
  model: any
  id: Ref<null> | Ref<string> | Ref<number> | null
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
interface UseGetData<M> {
  item: Ref<Readonly<M | null>>
  servicePath: Ref<string>
  isPending: Ref<boolean>
  hasBeenRequested: Ref<boolean>
  hasLoaded: Ref<boolean>
  isLocal: Ref<boolean>
  error: Ref<Error>
  get(id: Id, params?: Params): Promise<M | undefined>
}

export function useGet<M extends Model = Model>({
  model = null,
  id = null,
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

  function getId(): null | string | number {
    return unref(id as any)
  }
  function getParams(): Params {
    return unref(params as any)
  }

  const state = reactive<UseGetState>({
    isPending: false,
    hasBeenRequested: false,
    hasLoaded: false,
    error: null,
    isLocal: local as boolean,
  })

  const computes = {
    item: computed(() => {
      // const getterId = isRef(id) ? id.value : id
      // const getterParams = unref(params)
      // if (getterParams != null) {
      return model.getFromStore(unref(id as any), unref(params)) || null
      // } else {
      // return model.getFromStore(getterId) || null
      // }
    }),
    servicePath: computed(() => model.servicePath),
  }

  function get(id: Id, params?: Params): Promise<M | undefined> {
    const idToUse = unref(id)
    const paramsToUse = isRef(params) ? params.value : params

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
      get(id as any, params as Params)
    },
    { immediate }
  )

  return {
    ...toRefs(state),
    ...computes,
    get,
  }
}
