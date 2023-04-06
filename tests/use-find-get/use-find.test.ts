import { computed, ref } from 'vue-demi'
import { api, makeContactsData } from '../fixtures'
import { resetService, timeout } from '../test-utils'

const service = api.service('contacts')

beforeEach(async () => {
  resetService(service)
  service.service.store = makeContactsData()
})
afterEach(() => resetService(service))

describe('useFind', () => {
  test('correct default immediate values', async () => {
    const p = computed(() => {
      return { query: { name: 'Moose' } }
    })
    const {
      allLocalData,
      data,
      error,
      haveBeenRequested,
      haveLoaded,
      isPending,
      isSsr,
      cachedQuery,
      currentQuery,
      latestQuery,
      previousQuery,
      qid,
      request,
      requestCount,
      limit,
      skip,
      total,
      // utils
      clearError,
      find,
      queryWhen,
      // pagination
      canNext,
      canPrev,
      currentPage,
      pageCount,
      next,
      prev,
      toEnd,
      toPage,
      toStart,
    } = service.useFind(p)
    expect(allLocalData.value).toEqual([])
    expect(data.value).toEqual([])
    expect(error.value).toBeNull()
    expect(haveBeenRequested.value).toBe(false)
    expect(haveLoaded.value).toBe(false)
    expect(isPending.value).toBe(false)
    expect(isSsr.value).toBe(false)
    expect(currentQuery.value).toBeNull()
    expect(cachedQuery.value).toBeNull()
    expect(latestQuery.value).toBeNull()
    expect(previousQuery.value).toBeNull()
    expect(qid.value).toBe('default')
    expect(request.value).toBeNull()
    expect(requestCount.value).toBe(0)
    expect(limit.value).toBe(10)
    expect(skip.value).toBe(0)
    expect(total.value).toBe(0)
    // utils
    expect(typeof clearError).toBe('function')
    expect(typeof find).toBe('function')
    expect(typeof queryWhen).toBe('function')
    // pagination
    expect(canNext.value).toEqual(false)
    expect(canPrev.value).toEqual(false)
    expect(currentPage.value).toBe(1)
    expect(pageCount.value).toBe(1)
    expect(typeof next).toBe('function')
    expect(typeof prev).toBe('function')
    expect(typeof toEnd).toBe('function')
    expect(typeof toPage).toBe('function')
    expect(typeof toStart).toBe('function')
  })

  describe('paginate on client', () => {
    test('returns stored data', async () => {
      const name = ref('Moose')
      const params = computed(() => ({ query: { name } }))
      const { data, total } = service.useFind(params)
      expect(data.value.length).toBe(0)
      expect(total.value).toBe(0)

      await service.find({})

      expect(data.value.length).toBe(1)
      expect(total.value).toBe(1)
      expect(data.value[0].name).toBe('Moose')

      name.value = 'Goose'

      expect(data.value[0].name).toBe('Goose')
    })

    test('does not cache values #72', async () => {
      const query = ref<any>({ name: 'Moose' })
      const _params = computed(() => {
        return { query }
      })
      const { data, find } = service.useFind(_params)
      await find()
      expect(data.value[0].name).toBe('Moose')

      query.value = { age: 21 }

      expect(data.value.length).toBe(1)
      expect(data.value[0].name).toBe('Marshall')
    })
  })
})

describe('Local Pagination', () => {
  test('pagination attributes enabled on the store', async () => {
    const _params = computed(() => {
      return { query: { name: 'Moose' } }
    })
    const { limit, skip, total } = service.useFind(_params)

    expect(limit).toBeDefined()
    expect(skip).toBeDefined()
    expect(total).toBeDefined()
  })

  test('pagination attributes in the params', async () => {
    // request all data
    await service.find({ query: { $limit: 300 } })

    const $limit = ref(5)
    const $skip = ref(0)

    const _params = computed(() => {
      return {
        query: { $limit, $skip },
      }
    })
    const result = service.useFind(_params)

    expect(result.limit.value).toBe(5)
    expect(result.skip.value).toBe(0)
    expect(result.total.value).toBe(12)

    expect(result.data.value[0]._id).toBe('1')

    $limit.value = 3
    $skip.value = 5

    expect(result.data.value[0]._id).toBe('6')
  })

  test('pagination attributes in second argument', async () => {
    // request all data
    await service.find({ query: { $limit: 300 } })

    const pagination = {
      limit: ref(5),
      skip: ref(0),
    }

    const _params = computed(() => {
      return { query: {} }
    })
    const result = service.useFind(_params, { pagination })

    expect(result.limit.value).toBe(5)
    expect(result.skip.value).toBe(0)
    expect(result.total.value).toBe(12)

    expect(result.data.value[0]._id).toBe('1')

    pagination.limit.value = 3
    pagination.skip.value = 5

    expect(result.data.value[0]._id).toBe('6')
  })
})

describe('Server Pagination', () => {
  test('paginateOnServer enables server requests', async () => {
    const params = computed(() => {
      return { query: { $limit: 3, $skip: 0 } }
    })
    const { haveBeenRequested, data, request } = service.useFind(params, { paginateOnServer: true })
    expect(haveBeenRequested.value).toBe(true)
    expect(data.value.length).toBe(0)

    await request.value
    expect(data.value.length).toBe(3)
  })

  test('paginateOnServer with `immediate` false', async () => {
    const params = computed(() => {
      return { query: { $limit: 3, $skip: 0 } }
    })
    const { haveBeenRequested, data, request } = service.useFind(params, { paginateOnServer: true, immediate: false })
    expect(haveBeenRequested.value).toBe(false)

    await request.value
    expect(data.value.length).toBe(0)
  })

  test('use `queryWhen` to control queries', async () => {
    const params = computed(() => {
      return {
        query: { $limit: 3, $skip: 0 },
        qid: 'test',
      }
    })
    const { request, currentQuery, requestCount, queryWhen, next, prev } = service.useFind(params, {
      paginateOnServer: true,
    })

    // run the query if we don't already have items.
    queryWhen(() => {
      if (!currentQuery.value || !currentQuery.value.items.length) {
        return true
      }
      return false
    })

    await request.value
    expect(requestCount.value).toBe(1)

    // Will make another request, since we don't have the page
    await next()
    expect(requestCount.value).toBe(2)

    // no request will be made, since we already have data for this page
    await prev()
    expect(requestCount.value).toBe(2)
  })

  test('loading indicators during server pagination', async () => {
    const params = computed(() => {
      return { query: { $limit: 3, $skip: 0 } }
    })
    const { isPending, haveBeenRequested, haveLoaded, request, skip, next } = service.useFind(params, {
      paginateOnServer: true,
    })
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

    const params = computed(() => {
      return { query: { $limit: 3, $skip: 0 } }
    })

    const { error, clearError, find } = service.useFind(params, { paginateOnServer: true, immediate: false })
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

    const params = computed(() => {
      return { query: { $limit: 3, $skip: 0 } }
    })
    const { error, find } = service.useFind(params, { paginateOnServer: true, immediate: false })
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
})

describe('latestQuery and previousQuery', () => {
  test('paginateOnServer stores latestQuery and previousQuery', async () => {
    const params = computed(() => {
      return { query: { $limit: 3, $skip: 0 } }
    })
    const { latestQuery, previousQuery, find, next } = service.useFind(params, {
      paginateOnServer: true,
      immediate: false,
    })

    expect(latestQuery.value).toBe(null)

    await find()

    const keys = [
      'qid',
      'query',
      'queryId',
      'queryParams',
      'pageParams',
      'pageId',
      'isExpired',
      'ids',
      'items',
      'total',
      'queriedAt',
      'queryState',
      'ssr',
    ]

    expect(Object.keys(latestQuery.value as any)).toEqual(keys)
    expect(previousQuery.value).toBe(null)

    await next()

    expect(Object.keys(latestQuery.value as any)).toEqual(keys)
    expect(Object.keys(previousQuery.value as any)).toEqual(keys)
  })

  describe('Has `allLocalData`', () => {
    test('allLocalData contains all stored data', async () => {
      const _params = computed(() => {
        return { query: { $limit: 4, $skip: 0 } }
      })
      const { allLocalData, find, next } = service.useFind(_params, { paginateOnServer: true })
      await find()
      await next()
      expect(allLocalData.value.length).toBe(8)
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
      const params = computed(() => {
        return { query: { $limit: 4, $skip: 0 } }
      })
      const { data, find, next, request, isPending } = service.useFind(params, {
        paginateOnServer: true,
        immediate: false,
      })
      await find()

      const idsFromFirstPage = data.value.map((i) => i._id)
      expect(idsFromFirstPage).toEqual(['1', '2', '3', '4'])

      next()

      expect(isPending.value).toBe(false)

      await timeout(0)

      const idsWhilePending = data.value.map((i) => i._id)
      expect(idsWhilePending).toEqual(idsFromFirstPage)

      await request.value

      const idsAfterRequest = data.value.map((i) => i._id)
      expect(idsAfterRequest).not.toEqual(idsFromFirstPage)
      expect(idsAfterRequest).not.toEqual(idsWhilePending)
    }, 400000)
  })

  test('return null from computed params to prevent a request', async () => {
    const shouldQuery = ref(true)
    const name = ref('Moose')

    const params = computed(() => {
      if (!shouldQuery.value) return null
      return { query: { name } }
    })
    const { data, requestCount, request } = service.useFind(params, { paginateOnServer: true })

    await request.value

    expect(data.value.length).toBe(1)
    expect(requestCount.value).toBe(1)

    shouldQuery.value = false
    name.value = 'Goose'

    await request.value

    // no request send because params were null
    expect(requestCount.value).toBe(1)

    shouldQuery.value = true

    // wait for watcher to update the `request`
    await timeout(0)
    await request.value

    expect(requestCount.value).toBe(2)
  })
})
