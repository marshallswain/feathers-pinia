import { computed } from 'vue-demi'
import { api, makeContactsData } from '../fixtures/index.js'
import { resetService } from '../test-utils.js'

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
    expect(limit.value).toBe(20)
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

  test('applies default limit to query', async () => {
    const result = await service.find()
    // defaultLimit is 20 but there are only 12 records.
    expect(result.data.length).toBe(12)
  })
})
