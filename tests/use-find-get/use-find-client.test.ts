import { vi } from 'vitest'
import { computed, ref } from 'vue-demi'
import { api, makeContactsData } from '../fixtures/index.js'
import { resetService } from '../test-utils.js'

const service = api.service('contacts')

beforeEach(async () => {
  resetService(service)
  service.service.store = makeContactsData()
})
afterEach(() => resetService(service))

describe('Local Pagination', () => {
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

    test('shows correct paginated store results', async () => {
      const params = computed(() => {
        return { query: { $limit: 3 } }
      })
      const { data, find, next } = service.useFind(params)
      await find()
      expect(data.value.length).toBe(3)
      expect(data.value[0].name).toBe('Moose')

      await next()

      expect(data.value[0].name).toBe('Loose')
    })
  })
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

  test('can use `find` to query the server with current params', async () => {
    // Throw an error in a hook
    const hook = vi.fn()
    service.hooks({ before: { find: [hook] } })

    const params = computed(() => {
      return { query: { $limit: 3, $skip: 0 } }
    })

    const { data, find } = service.useFind(params, { paginateOn: 'server', immediate: false })

    expect(hook).not.toHaveBeenCalled()

    await find()

    expect(hook).toHaveBeenCalled()
    expect(data.value.length).toBe(3)
  })

  test('allLocalData contains all stored data', async () => {
    const _params = computed(() => {
      return { query: { $limit: 4, $skip: 0 } }
    })
    const { allLocalData, find, next } = service.useFind(_params)
    await find()
    await next()
    expect(allLocalData.value.length).toBe(12)
  })
})
