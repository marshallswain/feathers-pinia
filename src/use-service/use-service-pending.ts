import { NullableId } from '@feathersjs/feathers'
import { computed, ref, Ref, set, del } from 'vue-demi'
import { RequestTypeById } from './types'

const defaultPending = () => ({
  find: 0,
  count: 0,
  get: 0,
  create: 0,
  update: 0,
  patch: 0,
  remove: 0,
})

export const useServicePending = () => {
  const isPending = ref(defaultPending())

  const createPendingById = ref({}) as Ref<Record<string | number | symbol, true>>
  const updatePendingById = ref({}) as Ref<Record<string | number | symbol, true>>
  const patchPendingById = ref({}) as Ref<Record<string | number | symbol, true>>
  const removePendingById = ref({}) as Ref<Record<string | number | symbol, true>>

  const isFindPending = computed(() => {
    return isPending.value.find > 0
  })

  const isCountPending = computed(() => {
    return isPending.value.count > 0
  })

  const isGetPending = computed(() => {
    return isPending.value.get > 0
  })

  const isCreatePending = computed(() => {
    return isPending.value.create > 0 || Object.keys(createPendingById.value).length > 0
  })

  const isUpdatePending = computed(() => {
    return isPending.value.update > 0 || Object.keys(updatePendingById.value).length > 0
  })

  const isPatchPending = computed(() => {
    return isPending.value.patch > 0 || Object.keys(patchPendingById.value).length > 0
  })

  const isRemovePending = computed(() => {
    return isPending.value.remove > 0 || Object.keys(removePendingById.value).length > 0
  })

  function setPending(method: 'find' | 'count' | 'get' | 'create' | 'update' | 'patch' | 'remove', value: boolean) {
    if (value) {
      isPending.value[method]++
    } else {
      isPending.value[method]--
    }
  }

  function setPendingById(id: NullableId, method: RequestTypeById, val: boolean) {
    if (id == null) return

    let place

    if (method === 'create') place = createPendingById.value
    else if (method === 'update') place = updatePendingById.value
    else if (method === 'patch') place = patchPendingById.value
    else if (method === 'remove') place = removePendingById.value

    if (val) {
      set(place, id, true)
    } else {
      del(place, id)
    }
  }

  function unsetPendingById(...ids: NullableId[]) {
    ids.forEach((id) => {
      if (id == null) return
      del(createPendingById.value, id)
      del(updatePendingById.value, id)
      del(patchPendingById.value, id)
      del(removePendingById.value, id)
    })
  }

  function clearAll() {
    isPending.value = defaultPending()

    createPendingById.value = {}
    updatePendingById.value = {}
    patchPendingById.value = {}
    removePendingById.value = {}
  }

  return {
    isPending,
    createPendingById,
    updatePendingById,
    patchPendingById,
    removePendingById,
    isFindPending,
    isCountPending,
    isGetPending,
    isCreatePending,
    isUpdatePending,
    isPatchPending,
    isRemovePending,
    setPending,
    setPendingById,
    unsetPendingById,
    clearAll,
  }
}
