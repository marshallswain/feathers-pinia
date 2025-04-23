import { vi } from 'vitest'
import { ref } from 'vue-demi'
import { api, makeContactsData } from '../fixtures/index.js'
import { resetService, timeout } from '../test-utils.js'

const service = api.service('contacts')

beforeEach(async () => {
  resetService(service)
  service.service.store = makeContactsData()
})
afterEach(() => resetService(service))

describe('useGet', () => {
  describe('Default behavior fetched data from the server', () => {
    test('can pass a primitive id', async () => {
      const contact$ = service.useGet('1')
      await contact$.request
      expect(contact$.data?._id).toBe('1')
      expect(contact$.requestCount).toBe(1)
    })

    test('can pass a ref id', async () => {
      const id = ref('1')
      const contact$ = service.useGet(id)
      await contact$.request
      expect(contact$.data?._id).toBe('1')
    })

    test.skip('changing id updates data', async () => {
      const id = ref('1')
      const contact$ = service.useGet(id)
      await contact$.request

      expect(contact$.data?._id).toBe('1')

      id.value = '2'

      // wait for watcher to run
      await timeout(0)
      await contact$.request

      expect(contact$.data?._id).toBe('2')
    })

    test('id can be null', async () => {
      const id = ref(null)
      const contact$ = service.useGet(id, {})
      expect(contact$.data).toBe(null)
    })

    test.skip('can show previous record while a new one loads', async () => {
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
      const contact$ = service.useGet(id)

      await contact$.request

      expect(contact$.isPending).toBe(false)
      expect(contact$.data?._id).toBe('1')

      id.value = '2'

      await timeout(20)

      expect(contact$.isPending).toBe(true)
      expect(contact$.data?._id).toBe('1')

      await contact$.request

      expect(contact$.isPending).toBe(false)
      expect(contact$.data?._id).toBe('2')
    })

    test.skip('can prevent a query with queryWhen', async () => {
      const id = ref('1')
      const contact$ = service.useGet(id, {
        immediate: false,
      })
      const queryWhenFn = vi.fn(() => {
        return !contact$.data
      })
      contact$.queryWhen(queryWhenFn)
      expect(contact$.requestCount).toBe(0)

      await contact$.get()

      // queryWhen is called even when manually calling `get`
      expect(queryWhenFn).toHaveBeenCalled()
      expect(contact$.requestCount).toBe(1)

      id.value = '2'
      await timeout(20)
      await contact$.request

      expect(contact$.requestCount).toBe(2)

      id.value = '1'
      await timeout(20)
      await contact$.request

      expect(contact$.requestCount).toBe(2)
      expect(queryWhenFn).toHaveBeenCalledTimes(3)
    })

    test.skip('can disable watch', async () => {
      const id = ref('1')
      const contact$ = service.useGet(id, { watch: false })
      expect(contact$.requestCount).toBe(0)

      await contact$.get()

      expect(contact$.requestCount).toBe(1)

      id.value = '2'
      await timeout(20)
      await contact$.request

      expect(contact$.requestCount).toBe(1)

      id.value = '1'
      await timeout(20)
      await contact$.request

      expect(contact$.requestCount).toBe(1)
    })
  })

  describe('Manual Get with Ref', () => {
    test('can update ref and manually get correct data', async () => {
      const id = ref('1')
      const contact$ = service.useGet(id, { immediate: false })
      expect(contact$.data).toBeNull()

      await contact$.get()
      expect(contact$.data?._id).toBe('1')

      id.value = '2'
      expect(contact$.data).toBeNull()

      await contact$.get()
      expect(contact$.data?._id).toBe('2')
    })
  })

  describe('Can be configured to not fetch data', () => {
    test('no watch, no immediate', async () => {
      // assume we fetched data separately
      await service.find({ query: { $limit: 20 } })

      const id = ref('1')
      const contact$ = service.useGet(id, { watch: false, immediate: false })
      await contact$.request
      expect(contact$.data?._id).toBe('1')
      expect(contact$.requestCount).toBe(0)
    })
  })

  describe('clones', () => {
    test('can return clones', async () => {
      const id = ref('1')
      const contact$ = service.useGet(id, { clones: true })
      await contact$.request
      expect(contact$.data?._id).toBe('1')
      expect(contact$.data?.__isClone).toBe(true)
    })
  })

  describe('useGetOnce', () => {
    test('store.useGetOnce only queries once per id', async () => {
      const id = ref('1')
      const contact$ = service.useGetOnce(id)
      expect(contact$.requestCount).toBe(1)
      expect(contact$.data).toBe(null)

      // Wait for the internal request and for the data to fill the store.
      await contact$.request
      await timeout(20)
      await contact$.get()

      // queryWhen is called even when manually calling `get`
      expect(contact$.requestCount).toBe(1)

      id.value = '2'
      await timeout(20)
      await contact$.request

      expect(contact$.requestCount).toBe(2)

      id.value = '1'
      await timeout(20)
      await contact$.request

      expect(contact$.requestCount).toBe(2)
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

      const contact$ = service.useGet('1', { immediate: false })
      expect(contact$.error).toBe(null)

      await contact$.get()
      // wait extra time to make sure the request happened
      await timeout(10)
      await contact$.request

      expect(contact$.error.message).toBe('fail')

      contact$.clearError()

      expect(contact$.error).toBe(null)
    })

    test('swallows error and sets error ref if a service error is received', async () => {
      const contact$ = service.useGet('A', { immediate: false })

      await contact$.get()
      // wait extra time to make sure the request happened
      await timeout(10)
      await contact$.request

      expect(contact$.data).toBe(null)
      expect(contact$.error.message).toBe('No record found for id \'A\'')

      contact$.clearError()

      expect(contact$.error).toBe(null)
    })
  })
})
