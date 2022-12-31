import type { Tasks, TasksData, TasksQuery } from './feathers-schema-tasks'
import { type ModelInstance, useInstanceDefaults, useService } from '../src'
import { createPinia, defineStore } from 'pinia'
import { api } from './feathers'
import { resetStores, timeout } from './test-utils'
import { useGet } from '../src/use-get'
import { ref } from 'vue-demi'
import { useFeathersModel } from '../src/use-base-model'
import { feathersPiniaHooks } from '../src/hooks'
import { vi } from 'vitest'

const pinia = createPinia()
const service = api.service('tasks')

const modelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({}, data)
  return withDefaults
}
const Task = useFeathersModel<Tasks, TasksData, TasksQuery, typeof modelFn>(
  { name: 'Task', idField: '_id', service },
  modelFn,
)
type TaskInstance = ReturnType<typeof Task>

// passing the Model into `useService` overwrites the model's feathers methods to proxy through the store.
const useTaskStore = defineStore('counter', () => {
  const serviceUtils = useService<TaskInstance, TasksData, TasksQuery, typeof Task>({
    service,
    idField: '_id',
    Model: Task,
  })

  return { ...serviceUtils }
})
const taskStore = useTaskStore(pinia)
Task.setStore(taskStore)

service.hooks({
  around: {
    all: [...feathersPiniaHooks(Task)],
  },
})

const reset = () => {
  resetStores(service, taskStore)
}

beforeEach(async () => {
  reset()
  service.store = {
    1: { _id: '1', text: 'Moose' },
    2: { _id: '2', text: 'moose' },
    3: { _id: '3', text: 'Goose' },
    4: { _id: '4', text: 'Loose' },
    5: { _id: '5', text: 'Marshall' },
    6: { _id: '6', text: 'David' },
    7: { _id: '7', text: 'Beau' },
    8: { _id: '8', text: 'Batman' },
    9: { _id: '9', text: 'Flash' },
    10: { _id: '10', text: 'Wolverine' },
    11: { _id: '11', text: 'Rogue' },
    12: { _id: '12', text: 'Jubilee' },
  }
})
afterEach(() => reset())

describe('Factory Function', () => {
  test('can use `useGet` to get a Get instance', async () => {
    const returned = useGet(1, { store: taskStore })
    expect(returned.data.value).toBeDefined()
  })
})

describe('Manual Get with Ref', () => {
  test('can update ref and manually get correct data', async () => {
    const id = ref('1')
    const { data, get } = useGet(id, { store: taskStore, immediate: false })
    expect(data.value).toBeNull()

    await get()
    expect(data.value?._id).toBe('1')

    id.value = '2'
    expect(data.value).toBeNull()

    await get()
    expect(data.value?._id).toBe('2')
  })
})

describe('Get Class', () => {
  beforeEach(async () => {
    await taskStore.find({ query: { $limit: 20 } })
  })

  test('can pass a primitive id', async () => {
    const { data, requestCount } = useGet('1', { store: taskStore })
    expect(data.value?._id).toBe('1')
    expect(requestCount.value).toBe(0)
  })

  test('can pass a ref id', async () => {
    const id = ref('1')
    const { data } = useGet(id, { store: taskStore })
    expect(data.value?._id).toBe('1')
  })

  test('updating returned id updates data', async () => {
    const { id, data } = useGet('1', { store: taskStore })
    expect(id.value).toBe('1')
    expect(data.value?._id).toBe('1')

    id.value = '2'

    expect(data.value?._id).toBe('2')
  })

  test('id can be null from store', async () => {
    const { id, data } = useGet(null, { store: taskStore })
    expect(id.value).toBe(null)
    expect(data.value).toBe(null)
  })
})

describe('Service Store', () => {
  beforeEach(async () => {
    await taskStore.find({ query: { $limit: 20 } })
  })

  test('works as client-only useGet', async () => {
    const id = ref('1')
    const { data, request, requestCount } = taskStore.useGet(id)
    await request.value
    expect(data.value?._id).toBe('1')
    expect(requestCount.value).toBe(0)
  })

  test('works with onServer', async () => {
    const id = ref('1')
    const { data, request, requestCount } = taskStore.useGet(id, { onServer: true })
    await request.value
    expect(data.value?._id).toBe('1')
    expect(requestCount.value).toBe(1)
  })
})

describe('With onServer', () => {
  test('can fetch data from the server', async () => {
    const id = ref('1')
    const { data, request, requestCount } = useGet(id, { store: taskStore, onServer: true })
    await request.value
    expect(data.value?._id).toBe('1')
    expect(requestCount.value).toBe(1)
  })

  test('watches id', async () => {
    const id = ref('1')
    const { data, request, isPending, hasLoaded, hasBeenRequested } = useGet(id, {
      store: taskStore,
      onServer: true,
    })
    expect(isPending.value).toBe(true)
    expect(hasLoaded.value).toBe(false)
    expect(hasBeenRequested.value).toBe(true)

    await request.value

    expect(isPending.value).toBe(false)
    expect(data.value?._id).toBe('1')

    id.value = '2'
    await timeout(20)
    await request.value

    expect(data.value?._id).toBe('2')
  })

  test('id can be null with onServer', async () => {
    const { id, data, requestCount, get } = useGet(null, { store: taskStore, immediate: false, onServer: true })
    expect(id.value).toBe(null)
    expect(data.value).toBe(null)
    expect(requestCount.value).toBe(0)

    try {
      expect(await get()).toThrow()
    } catch (error) {
      expect(error).toBeTruthy()
    }
  })

  test('can show previous record while a new one loads', async () => {
    // A hook to cause a delay so we can check pending state
    let hookRunCount = 0
    const hook = async () => {
      if (hookRunCount < 2) {
        hookRunCount++
        await timeout(50)
      }
    }
    service.hooks({ before: { get: [hook] } })

    const id = ref('1')
    const { data, request, isPending } = useGet(id, { store: taskStore, onServer: true })

    await request.value

    expect(isPending.value).toBe(false)
    expect(data.value?._id).toBe('1')

    id.value = '2'

    await timeout(20)

    expect(isPending.value).toBe(true)
    expect(data.value?._id).toBe('1')

    await request.value

    expect(isPending.value).toBe(false)
    expect(data.value?._id).toBe('2')
  })

  test('can prevent a query with queryWhen', async () => {
    const id = ref('1')
    const { data, get, requestCount, queryWhen, request } = useGet(id, {
      store: taskStore,
      onServer: true,
      immediate: false,
    })
    const queryWhenFn = vi.fn(() => {
      return !data.value
    })
    queryWhen(queryWhenFn)
    expect(requestCount.value).toBe(0)

    await get()

    // queryWhen is called even when manually calling `get`
    expect(queryWhenFn).toHaveBeenCalled()
    expect(requestCount.value).toBe(1)

    id.value = '2'
    await timeout(20)
    await request.value

    expect(requestCount.value).toBe(2)

    id.value = '1'
    await timeout(20)
    await request.value

    expect(requestCount.value).toBe(2)
    expect(queryWhenFn).toHaveBeenCalledTimes(3)
  })

  test('store.useGetOnce only queries once per id', async () => {
    const id = ref('1')
    const { data, get, requestCount, request } = taskStore.useGetOnce(id)
    expect(requestCount.value).toBe(1)
    expect(data.value).toBe(null)

    // Wait for the internal request and for the data to fill the store.
    await request.value
    await timeout(20)
    await get()

    // queryWhen is called even when manually calling `get`
    expect(requestCount.value).toBe(1)

    id.value = '2'
    await timeout(20)
    await request.value

    expect(requestCount.value).toBe(2)

    id.value = '1'
    await timeout(20)
    await request.value

    expect(requestCount.value).toBe(2)
  })

  test('can disable watch', async () => {
    const id = ref('1')
    const { get, requestCount, request } = useGet(id, {
      store: taskStore,
      onServer: true,
      watch: false,
    })
    expect(requestCount.value).toBe(0)

    await get()

    expect(requestCount.value).toBe(1)

    id.value = '2'
    await timeout(20)
    await request.value

    expect(requestCount.value).toBe(1)

    id.value = '1'
    await timeout(20)
    await request.value

    expect(requestCount.value).toBe(1)
  })
})

describe('Errors', () => {
  test('sets and clears errors', async () => {
    // Throw an error in a hook
    let hasHookRun = false
    const hook = () => {
      if (!hasHookRun) {
        hasHookRun = true
        throw new Error('fail')
      }
    }
    service.hooks({ before: { get: [hook] } })

    const { error, clearError, get } = useGet('1', { store: taskStore, onServer: true, immediate: false })
    expect(error.value).toBe(null)
    try {
      expect(await get()).toThrow()
    } catch (err: any) {
      expect(err.message).toBe('fail')
      expect(error.value.message).toBe('fail')

      clearError()

      expect(error.value).toBe(null)
    }
  })

  test('receives 404 from service if not found', async () => {
    const { data, error, clearError, get } = taskStore.useGet('A', { onServer: true, immediate: false })

    try {
      expect(await get()).toThrow()
    } catch (err: any) {
      expect(data.value).toBe(null)
      expect(err.message).toBe("No record found for id 'A'")
      expect(error.value.message).toBe("No record found for id 'A'")

      clearError()

      expect(error.value).toBe(null)
    }
  })
})
