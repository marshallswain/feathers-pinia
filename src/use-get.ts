import { reactive, computed, toRefs, isRef, unref, watch, Ref } from 'vue'
import { Params } from './types'
import { Model } from './service-store/types'
import { Id } from '@feathersjs/feathers'

interface UseGetOptions {
  model: any
  id: null | string | number | Ref<null> | Ref<string> | Ref<number>
  params?: Params | Ref<Params>
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

export function useGet<M extends Model = Model>(options: UseGetOptions) {
  const defaults: UseGetOptions = {
    model: null,
    id: null,
    params: undefined,
    queryWhen: computed((): boolean => true),
    local: false,
    immediate: true,
  }
  const { model, id, params, queryWhen, local, immediate } = Object.assign({}, defaults, options)

  if (!model) {
    throw new Error(
      `No model provided for useGet(). Did you define and register it with FeathersVuex?`
    )
  }

  function getId(): null | string | number {
    return isRef(id) ? id.value : id || null
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
      const getterId = isRef(id) ? id.value : id
      const getterParams = isRef(params)
        ? Object.assign({}, params.value)
        : params == null
        ? params
        : { ...params }
      if (getterParams != null) {
        return model.getFromStore(getterId, getterParams) || null
      } else {
        return model.getFromStore(getterId) || null
      }
    }),
    servicePath: computed(() => model.servicePath),
  }

  function get(id: Id, params?: Params): Promise<M | undefined> {
    const idToUse = isRef<Id>(id) ? id.value : id
    const paramsToUse = isRef(params) ? params.value : params

    if (idToUse != null && queryWhen?.value && !state.isLocal) {
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
    [() => getId(), () => getParams()],
    ([id, params]) => {
      get(id as string | number, params as Params)
    },
    { immediate }
  )

  return {
    ...toRefs(state),
    ...computes,
    get,
  }
}
