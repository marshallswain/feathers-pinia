import type { Tasks, TasksData, TasksQuery } from './feathers-schema-tasks'
import { ModelInstance, useInstanceDefaults, useService } from '../src'
import { createPinia, defineStore } from 'pinia'
import { api } from './feathers'
import { resetStores, timeout } from './test-utils'
import { useFind } from '../src/use-find'
import { computed, ref } from 'vue-demi'
import { useFeathersModel } from '../src/use-base-model'
import { feathersPiniaHooks } from '../src/hooks'

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
    1: { _id: 1, text: 'Moose' },
    2: { _id: 2, text: 'moose' },
    3: { _id: 3, text: 'Goose' },
    4: { _id: 4, text: 'Loose' },
    5: { _id: 5, text: 'Marshall' },
    6: { _id: 6, text: 'David' },
    7: { _id: 7, text: 'Beau' },
    8: { _id: 8, text: 'Batman' },
    9: { _id: 9, text: 'Flash' },
    10: { _id: 10, text: 'Wolverine' },
    11: { _id: 11, text: 'Rogue' },
    12: { _id: 12, text: 'Jubilee' },
  }
})
afterEach(() => reset())

describe('useFind Factory Function', () => {
  test('can use `useFind` to get a Find instance', async () => {
    const params = {
      query: { text: 'Moose' },
      store: taskStore,
    }
    const returned = useFind(params)
    expect(returned.data.value).toBeDefined()
  })
})

describe('useFind', () => {
  beforeEach(async () => {
    await taskStore.find({ query: { $limit: 20 } })
  })
  test('can pass plain params', async () => {
    const params = {
      query: { text: 'Moose' },
      store: taskStore,
    }
    const returned = useFind(params)
    expect(returned.data.value).toBeDefined()
  })

  test('changing returned params updates data', async () => {
    const _params = {
      query: { text: 'Moose' },
      store: taskStore,
    }
    const { params, data, total } = useFind(_params)
    expect(data.value.length).toBe(1)
    expect(total.value).toBe(1)
    expect(data.value[0].text).toBe('Moose')

    params.value.query.text = 'Goose'

    expect(data.value[0].text).toBe('Goose')
  })
})

describe('queryWhen', () => {
  test('use `queryWhen` to control queries', async () => {
    const { request, currentQuery, requestCount, queryWhen, next, prev } = useFind({
      query: { $limit: 3, $skip: 0 },
      store: taskStore,
      onServer: true,
      qid: 'test',
    })
    await request.value

    expect(requestCount.value).toBe(1)

    // run the query if we don't already have items.
    queryWhen(() => {
      if (!currentQuery.value || !currentQuery.value.items.length) {
        return true
      }
      return false
    })
    // The `watchParams` does not automatically trigger request
    expect(requestCount.value).toBe(1)

    await next()

    // Another request went out to get the next page.
    expect(requestCount.value).toBe(2)

    await prev()

    // Going back to a cached page so we didn't make another request.
    expect(requestCount.value).toBe(2)
  })

  test('does not make pagination requests when queryWhen is false', async () => {
    const { request, requestCount, queryWhen, next, prev } = useFind({
      query: { $limit: 3, $skip: 0 },
      store: taskStore,
      onServer: true,
      qid: 'test',
      immediate: false,
    })
    await request.value

    expect(requestCount.value).toBe(0)

    // run the query if we don't already have items.
    queryWhen(() => {
      return false
    })
    // The `watchParams` does not automatically trigger request
    expect(requestCount.value).toBe(0)

    await next()

    // Another request went out to get the next page.
    expect(requestCount.value).toBe(0)

    await prev()

    // Going back to a cached page so we didn't make another request.
    expect(requestCount.value).toBe(0)
  })
})

describe('External Control With Provided Params', () => {
  beforeEach(async () => {
    await taskStore.find({ query: { $limit: 20 } })
  })
  test('changing provided params updates data', async () => {
    const _params = ref({
      query: { text: 'Moose' },
      store: taskStore,
    })
    const { data, total } = useFind(_params)
    expect(data.value.length).toBe(1)
    expect(total.value).toBe(1)

    _params.value.query.text = 'Goose'

    expect(data.value[0].text).toBe('Goose')
  })
})

describe('Pagination Attributes', () => {
  beforeEach(async () => {
    await taskStore.find({ query: { $limit: 20 } })
  })
  test('limit and skip are undefined if pagination is not provided in the query', async () => {
    // Turn off service's pagination
    const oldPaginate = service.options.paginate
    service.options.paginate = false

    const _params = {
      query: { text: 'Moose' },
      store: taskStore,
    }
    const findData = useFind(_params)

    expect(findData.limit.value).toBeUndefined()
    expect(findData.skip.value).toBeUndefined()
    expect(findData.total.value).toBe(1)

    // Re-enable service's pagination
    service.options.paginate = oldPaginate
  })

  test('pagination attributes enabled on the store', async () => {
    const _params = {
      query: { text: 'Moose' },
      store: taskStore,
    }
    const findData = useFind(_params)

    expect(findData.limit).toBeDefined()
    expect(findData.skip).toBeDefined()
    expect(findData.total).toBeDefined()
  })

  test('pagination attributes enabled in the query', async () => {
    // Turn off service's pagination
    const oldPaginate = service.options.paginate
    service.options.paginate = false

    const _params = {
      query: { text: 'Moose', $limit: 3, $skip: 0 },
      store: taskStore,
    }
    const findData = useFind(_params)

    expect(findData.limit).toBeDefined()
    expect(findData.skip).toBeDefined()
    expect(findData.total).toBeDefined()

    // Re-enable service's pagination
    service.options.paginate = oldPaginate
  })
})

describe('Local Pagination', () => {
  beforeEach(async () => {
    await taskStore.find({ query: { $limit: 20 } })
  })
  test('query without $limit or $skip returns all data', async () => {
    const params = {
      query: {},
      store: taskStore,
    }
    const { data } = useFind(params)
    expect(data.value.length).toBe(12)
  })

  test('can page local data', async () => {
    const params = {
      query: { $limit: 3, $skip: 0 },
      store: taskStore,
    }
    const { data, next } = useFind(params)
    expect(data.value.length).toBe(3)
    expect(data.value.map((i) => i._id)).toEqual([1, 2, 3])

    await next()

    expect(data.value.length).toBe(3)
    expect(data.value.map((i) => i._id)).toEqual([4, 5, 6])
  })
})

describe('Server Pagination', () => {
  test('passing `onServer` enables server pagination', async () => {
    const params = {
      query: {},
      store: taskStore,
      onServer: true,
    }
    const query = useFind(params)
    expect(query.data.value.length).toBe(0)
    expect(query.onServer).toBeTruthy()
  })

  test('onServer with `immediate` immediately fetches data', async () => {
    const params = {
      query: { $limit: 3, $skip: 0 },
      store: taskStore,
      onServer: true,
    }
    const { request, requestCount } = useFind(params)
    const response = await request.value
    expect(response?.data.length).toBe(3)
    expect(requestCount.value).toBe(1)
  })

  test('onServer, immediate: false does not immediately fetch data', async () => {
    const params = {
      query: { $limit: 3, $skip: 0 },
      store: taskStore,
      onServer: true,
      immediate: false,
    }
    const { request, requestCount } = useFind(params)
    expect(request.value).toBe(null)
    expect(requestCount.value).toBe(0)
  })

  test('server fetch without limit or skip sets both values based on the response', async () => {
    const params = {
      query: {},
      store: taskStore,
      onServer: true,
    }
    const { request, requestCount, limit, skip } = useFind(params)
    await request.value
    expect(requestCount.value).toBe(1)
    expect(limit.value).toBe(10)
    expect(skip.value).toBe(0)

    // Make sure a second request was not sent
    expect(requestCount.value).toBe(1)
  })

  test('paginate on server, immediate: false, passing no params uses the pagination params', async () => {
    const params = {
      query: { $limit: 3, $skip: 0 },
      store: taskStore,
      onServer: true,
      immediate: false,
    }
    const { data, requestCount, limit, skip, next, toEnd, pageCount, find } = useFind(params)
    await find()

    expect(data.value.map((i) => i._id)).toEqual([1, 2, 3])
    expect(requestCount.value).toBe(1)
    expect(limit.value).toBe(3)
    expect(skip.value).toBe(0)
    expect(pageCount.value).toBe(4)

    await next()
    expect(skip.value).toBe(3)

    // Make sure a second request was sent
    expect(requestCount.value).toBe(2)
    expect(data.value.map((i) => i._id)).toEqual([4, 5, 6])

    await toEnd()
    expect(skip.value).toBe(9)

    // Make sure a third request was sent
    expect(requestCount.value).toBe(3)
    expect(data.value.map((i) => i._id)).toEqual([10, 11, 12])
  })

  test('loading indicators during server pagination', async () => {
    const params = {
      query: { $limit: 3, $skip: 0 },
      store: taskStore,
      onServer: true,
    }
    const { isPending, haveBeenRequested, haveLoaded, request, skip, next } = useFind(params)
    expect(isPending.value).toBe(true)
    expect(haveLoaded.value).toBe(false)
    expect(haveBeenRequested.value).toBe(true)

    await request.value

    expect(isPending.value).toBe(false)
    expect(haveLoaded.value).toBe(true)
    expect(haveBeenRequested.value).toBe(true)

    await next()
    expect(skip.value).toBe(3)
  })

  test('errors populate during server pagination, manually clear error', async () => {
    // Throw an error in a hook
    let hasHookRun = false
    const hook = () => {
      if (!hasHookRun) {
        hasHookRun = true
        throw new Error('fail')
      }
    }
    service.hooks({ before: { find: [hook] } })

    const params = {
      query: { $limit: 3, $skip: 0 },
      store: taskStore,
      onServer: true,
      immediate: false,
    }

    const { error, clearError, find } = useFind(params)
    expect(error.value).toBe(null)
    try {
      expect(await find()).toThrow()
    } catch (err: any) {
      expect(err.message).toBe('fail')
      expect(error.value.message).toBe('fail')

      clearError()

      expect(error.value).toBe(null)
    }
  })

  test('errors populate during server pagination, auto-clear error', async () => {
    // Throw an error in a hook
    let hasHookRun = false
    const hook = () => {
      if (!hasHookRun) {
        hasHookRun = true
        throw new Error('fail')
      }
    }
    service.hooks({ before: { find: [hook] } })

    const params = {
      query: { $limit: 3, $skip: 0 },
      store: taskStore,
      onServer: true,
      immediate: false,
    }
    const { error, find } = useFind(params)
    expect(error.value).toBe(null)

    try {
      expect(await find()).toThrow()
    } catch (err: any) {
      expect(err.message).toBe('fail')
      expect(error.value.message).toBe('fail')

      await find()

      expect(error.value).toBe(null)
    }
  })

  test('onServer when server pagination is turned off', async () => {
    // Turn off service's pagination
    const oldPaginate = service.options.paginate
    service.options.paginate = false

    const params = {
      query: { $limit: 3, $skip: 0 },
      store: taskStore,
      onServer: true,
    }
    const { data, request, requestCount, limit, skip, next, toEnd, pageCount } = useFind(params)
    await request.value

    expect(data.value.map((i) => i._id)).toEqual([1, 2, 3])
    expect(requestCount.value).toBe(1)
    expect(limit.value).toBe(3)
    expect(skip.value).toBe(0)
    expect(pageCount.value).toBe(4)

    await next()
    expect(skip.value).toBe(3)
    await request.value

    // Make sure a second request was sent
    expect(requestCount.value).toBe(2)
    expect(data.value.map((i) => i._id)).toEqual([4, 5, 6])

    await toEnd()
    expect(skip.value).toBe(9)
    await request.value

    // Make sure a third request was sent
    expect(requestCount.value).toBe(3)
    expect(data.value.map((i) => i._id)).toEqual([10, 11, 12])

    // Re-enable service's pagination
    service.options.paginate = oldPaginate
  })
})

describe('latestQuery and previousQuery', () => {
  test('onServer stores latestQuery and previousQuery', async () => {
    const params = {
      query: { $limit: 3, $skip: 0 },
      store: taskStore,
      onServer: true,
      immediate: false,
    }
    const { latestQuery, previousQuery, find, next } = useFind(params)

    expect(latestQuery.value).toBe(null)

    await find()

    const _firstQuery = {
      isOutdated: undefined,
      pageId: '{"$limit":3,"$skip":0}',
      pageParams: {
        $limit: 3,
        $skip: 0,
      },
      qid: 'default',
      query: {},
      queryId: '{}',
      queryParams: {},
      response: {
        data: [
          { _id: 1, text: 'Moose' },
          { _id: 2, text: 'moose' },
          { _id: 3, text: 'Goose' },
        ],
        limit: 3,
        skip: 0,
        total: 12,
      },
    }

    expect(JSON.parse(JSON.stringify(latestQuery.value))).toEqual(_firstQuery)
    expect(previousQuery.value).toBe(null)

    await next()

    const _secondQuery = {
      pageId: '{"$limit":3,"$skip":3}',
      pageParams: {
        $limit: 3,
        $skip: 3,
      },
      qid: 'default',
      query: {},
      queryId: '{}',
      queryParams: {},
      response: {
        data: [
          { _id: 4, text: 'Loose' },
          { _id: 5, text: 'Marshall' },
          { _id: 6, text: 'David' },
        ],
        limit: 3,
        skip: 3,
        total: 12,
      },
    }

    expect(JSON.parse(JSON.stringify(latestQuery.value))).toEqual(_secondQuery)
    expect(JSON.parse(JSON.stringify(previousQuery.value))).toEqual(_firstQuery)
  })

  describe('Has `allData`', () => {
    test('allData contains all stored data', async () => {
      const _params = {
        query: { $limit: 4, $skip: 0 },
        store: taskStore,
        onServer: true,
      }
      const { allData, find, next } = useFind(_params)
      await find()
      await next()
      expect(allData.value.length).toBe(8)
    })

    test('shows current data while loading new data', async () => {
      // A hook to cause a delay so we can check pending state
      let hasHookRun = false
      const hook = async () => {
        if (!hasHookRun) {
          hasHookRun = true
          await timeout(50)
        }
      }
      service.hooks({ before: { find: [hook] } })

      const _params = {
        query: { $limit: 4, $skip: 0 },
        store: taskStore,
        onServer: true,
        immediate: false,
      }
      const { data, find, next, request, isPending } = useFind(_params)
      await find()

      const idsFromFirstPage = data.value.map((i) => i._id)
      expect(idsFromFirstPage).toEqual([1, 2, 3, 4])

      next()

      await timeout(0)

      expect(isPending.value).toBe(true)

      const idsWhilePending = data.value.map((i) => i._id)
      expect(idsWhilePending).toEqual(idsFromFirstPage)

      await request.value

      const idsAfterRequest = data.value.map((i) => i._id)
      expect(idsAfterRequest).not.toEqual(idsFromFirstPage)
      expect(idsAfterRequest).not.toEqual(idsWhilePending)
    })
  })
})

describe('Computed Params', () => {
  test('can use computed params, immediately sends request by default', async () => {
    const text = ref('Moose')
    const params = computed(() => {
      return {
        query: { text: text.value },
        store: taskStore,
        onServer: true,
      }
    })
    const { data, total, requestCount, request } = useFind(params)

    await request.value

    // requests are not sent by default
    expect(data.value.length).toBe(1)
    expect(requestCount.value).toBe(1)

    text.value = 'Goose'

    // Wait for watcher to run and the request to finish
    await timeout(20)
    await request.value

    // request was sent after computed params changed
    expect(requestCount.value).toBe(2)
    expect(total.value).toBe(1)
    expect(data.value[0].text).toBe('Goose')
  })

  test('computed params can start with limit and skip', async () => {
    const ids = ref([1, 2, 3, 4, 5, 6])
    const params = computed(() => {
      return {
        query: { _id: { $in: ids.value }, $limit: 10, $skip: 0 },
        store: taskStore,
        onServer: true,
      }
    })
    const { params: _params, data, total, requestCount, request } = useFind(params)

    expect(_params.value.query.$limit).toBe(10)
    expect(_params.value.query.$skip).toBe(0)

    await request.value

    // requests are not sent by default
    expect(data.value.length).toBe(6)
    expect(requestCount.value).toBe(1)

    ids.value = [4, 5, 6, 7, 8, 9, 10]

    // Wait for watcher to run and the request to finish
    await timeout(20)
    await request.value

    // request was sent after computed params changed
    expect(data.value.length).toBe(7)
    expect(requestCount.value).toBe(2)
    expect(total.value).toBe(7)
  })

  test.skip('return null from computed params to prevent a request', async () => {
    const params = computed(() => {
      // if (shouldQuery.value)
      return {
        query: { text: 'Moose' },
        store: taskStore,
        onServer: true,
      }
      // else return null
    })
    const { data, total, requestCount, request } = useFind(params)

    await request.value

    // requests are not sent by default
    expect(data.value.length).toBe(1)
    expect(requestCount.value).toBe(1)

    // Wait for watcher to run and the request to finish
    await timeout(20)
    await request.value

    // request was sent after computed params changed
    expect(requestCount.value).toBe(2)
    expect(total.value).toBe(1)
    expect(data.value[0].text).toBe('Goose')
  })
})
