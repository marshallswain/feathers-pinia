import { computed, ref } from 'vue-demi'
import { api, makeContactsData } from '../fixtures/index.js'
import { resetService, timeout } from '../test-utils.js'

const service = api.service('contacts')

beforeEach(async () => {
  resetService(service)
  service.service.store = makeContactsData()
})
afterEach(() => resetService(service))

describe('paginateOn: server', () => {
  test('paginateOn: server enables server requests', async () => {
    const params = computed(() => {
      return { query: { $limit: 3, $skip: 0 } }
    })
    const contacts$ = service.useFind(params, { paginateOn: 'server' })
    expect(contacts$.haveBeenRequested).toBe(true)
    expect(contacts$.data.length).toBe(0)

    await contacts$.request
    expect(contacts$.data.length).toBe(3)
  })

  test('paginateOn: server with `immediate` false', async () => {
    const params = computed(() => {
      return { query: { $limit: 3, $skip: 0 } }
    })
    const contacts$ = service.useFind(params, { paginateOn: 'server', immediate: false })
    expect(contacts$.haveBeenRequested).toBe(false)

    await contacts$.request
    expect(contacts$.data.length).toBe(0)
  })

  test('use `queryWhen` to control queries', async () => {
    const params = computed(() => {
      return {
        query: { $limit: 3, $skip: 0 },
        qid: 'test',
      }
    })
    const contacts$ = service.useFind(params, {
      paginateOn: 'server',
    })

    // run the query if we don't already have items.
    contacts$.queryWhen(() => {
      if (!contacts$.currentQuery || !contacts$.currentQuery.items.length)
        return true

      return false
    })

    await contacts$.request
    expect(contacts$.requestCount).toBe(1)

    // Will make another request, since we don't have the page
    await contacts$.next()
    expect(contacts$.requestCount).toBe(2)

    // no request will be made, since we already have data for this page
    await contacts$.prev()
    expect(contacts$.requestCount).toBe(2)
  })

  test('loading indicators during server pagination', async () => {
    const params = computed(() => {
      return { query: { $limit: 3, $skip: 0 } }
    })
    const contacts$ = service.useFind(params, {
      paginateOn: 'server',
    })
    expect(contacts$.isPending).toBe(true)
    expect(contacts$.haveLoaded).toBe(false)
    expect(contacts$.haveBeenRequested).toBe(true)

    await contacts$.request

    expect(contacts$.isPending).toBe(false)
    expect(contacts$.haveLoaded).toBe(true)
    expect(contacts$.haveBeenRequested).toBe(true)

    await contacts$.next()
    expect(contacts$.skip).toBe(3)
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

    const contacts$ = service.useFind(params, { paginateOn: 'server', immediate: false })
    expect(contacts$.error).toBe(null)
    try {
      expect(await contacts$.find()).toThrow()
    }
    catch (err: any) {
      expect(err.message).toBe('fail')
      expect(contacts$.error.message).toBe('fail')

      contacts$.clearError()

      expect(contacts$.error).toBe(null)
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
    const contacts$ = service.useFind(params, { paginateOn: 'server', immediate: false })
    expect(contacts$.error).toBe(null)

    try {
      expect(await contacts$.find()).toThrow()
    }
    catch (err: any) {
      expect(err.message).toBe('fail')
      expect(contacts$.error.message).toBe('fail')

      await contacts$.find()

      expect(contacts$.error).toBe(null)
    }
  })
})

describe('latestQuery and previousQuery', () => {
  test('paginateOn: server stores latestQuery and previousQuery', async () => {
    const params = computed(() => {
      return { query: { $limit: 3, $skip: 0 } }
    })
    const contacts$ = service.useFind(params, {
      paginateOn: 'server',
      immediate: false,
    })

    expect(contacts$.latestQuery).toBe(null)

    await contacts$.find()

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

    expect(Object.keys(contacts$.latestQuery as any)).toEqual(keys)
    expect(contacts$.previousQuery).toBe(null)

    await contacts$.next()

    expect(Object.keys(contacts$.latestQuery as any)).toEqual(keys)
    expect(Object.keys(contacts$.previousQuery as any)).toEqual(keys)
  })

  describe('Has `allLocalData`', () => {
    test('allLocalData contains all stored data', async () => {
      const _params = computed(() => {
        return { query: { $limit: 4, $skip: 0 } }
      })
      const contacts$ = service.useFind(_params, { paginateOn: 'server' })
      await contacts$.find()
      await contacts$.next()
      expect(contacts$.allLocalData.length).toBe(8)
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
      const contacts$ = service.useFind(params, {
        paginateOn: 'server',
        immediate: false,
      })
      await contacts$.find()

      const idsFromFirstPage = contacts$.data.map(i => i._id)
      expect(idsFromFirstPage).toEqual(['1', '2', '3', '4'])

      contacts$.next()

      expect(contacts$.isPending).toBe(true)

      await timeout(0)

      const idsWhilePending = contacts$.data.map(i => i._id)
      expect(idsWhilePending).toEqual(idsFromFirstPage)

      await contacts$.request

      const idsAfterRequest = contacts$.data.map(i => i._id)
      expect(idsAfterRequest).not.toEqual(idsFromFirstPage)
      expect(idsAfterRequest).not.toEqual(idsWhilePending)
    }, 400000)
  })

  test('return null from computed params to prevent a request', async () => {
    const shouldQuery = ref(true)
    const name = ref('Moose')

    const params = computed(() => {
      if (!shouldQuery.value)
        return null
      return { query: { name } }
    })
    const contacts$ = service.useFind(params, { paginateOn: 'server' })

    await contacts$.request

    expect(contacts$.data.length).toBe(1)
    expect(contacts$.requestCount).toBe(1)

    shouldQuery.value = false
    name.value = 'Goose'

    await contacts$.request

    // no request send because params were null
    expect(contacts$.requestCount).toBe(1)

    shouldQuery.value = true

    // wait for watcher to update the `request`
    await timeout(0)
    await contacts$.request

    expect(contacts$.requestCount).toBe(2)
  })
})
