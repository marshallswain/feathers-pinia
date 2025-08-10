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
    it('returns stored data', async () => {
      const name = ref('Moose')
      const params = computed(() => ({ query: { name } }))
      const contacts$ = service.useFind(params)
      expect(contacts$.data.length).toBe(0)
      expect(contacts$.total).toBe(0)

      await service.find({})

      expect(contacts$.data.length).toBe(1)
      expect(contacts$.total).toBe(1)
      expect(contacts$.data[0].name).toBe('Moose')

      name.value = 'Goose'

      expect(contacts$.data[0].name).toBe('Goose')
    })

    it('shows correct paginated store results', async () => {
      const params = computed(() => {
        return { query: { $limit: 3 } }
      })
      const contacts$ = service.useFind(params)
      await contacts$.find()
      expect(contacts$.data.length).toBe(3)
      expect(contacts$.data[0].name).toBe('Moose')

      await contacts$.next()

      expect(contacts$.data[0].name).toBe('Loose')
    })
  })
  it('pagination attributes enabled on the store', async () => {
    const _params = computed(() => {
      return { query: { name: 'Moose' } }
    })
    const contacts$ = service.useFind(_params)

    expect(contacts$.limit).toBeDefined()
    expect(contacts$.skip).toBeDefined()
    expect(contacts$.total).toBeDefined()
  })

  it('pagination attributes in the params', async () => {
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

    expect(result.limit).toBe(5)
    expect(result.skip).toBe(0)
    expect(result.total).toBe(12)

    expect(result.data[0]._id).toBe('1')

    $limit.value = 3
    $skip.value = 5

    expect(result.data[0]._id).toBe('6')
  })

  it('pagination attributes in second argument', async () => {
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

    expect(result.limit).toBe(5)
    expect(result.skip).toBe(0)
    expect(result.total).toBe(12)

    expect(result.data[0]._id).toBe('1')

    pagination.limit.value = 3
    pagination.skip.value = 5

    expect(result.data[0]._id).toBe('6')
  })

  it('can use `find` to query the server with current params', async () => {
    // Throw an error in a hook
    const hook = vi.fn()
    service.hooks({ before: { find: [hook] } })

    const params = computed(() => {
      return { query: { $limit: 3, $skip: 0 } }
    })

    const contacts$ = service.useFind(params, { paginateOn: 'server', immediate: false })

    expect(hook).not.toHaveBeenCalled()

    await contacts$.find()

    expect(hook).toHaveBeenCalled()
    expect(contacts$.data.length).toBe(3)
  })

  it('allLocalData contains all stored data', async () => {
    const _params = computed(() => {
      return { query: { $limit: 4, $skip: 0 } }
    })
    const contacts$ = service.useFind(_params)
    await contacts$.find()
    await contacts$.next()
    expect(contacts$.allLocalData.length).toBe(12)
  })
})
