import { ref } from "vue-demi"
import { api, makeContactsData } from "../fixtures/index.js"
import { resetService, timeout } from "../test-utils.js"
import { vi } from "vitest"

const service = api.service("contacts")

beforeEach(async () => {
  resetService(service)
  service.service.store = makeContactsData()
})
afterEach(() => resetService(service))

describe("useGet", () => {
  describe("Default behavior fetched data from the server", () => {
    test("can pass a primitive id", async () => {
      const { data, requestCount, request } = service.useGet("1")
      await request.value
      expect(data.value?._id).toBe("1")
      expect(requestCount.value).toBe(1)
    })

    test("can pass a ref id", async () => {
      const id = ref("1")
      const { data, request } = service.useGet(id)
      await request.value
      expect(data.value?._id).toBe("1")
    })

    test.skip("changing id updates data", async () => {
      const id = ref("1")
      const { data, request } = service.useGet(id)
      await request.value

      expect(data.value?._id).toBe("1")

      id.value = "2"

      // wait for watcher to run
      await timeout(0)
      await request.value

      expect(data.value?._id).toBe("2")
    })

    test("id can be null", async () => {
      const id = ref(null)
      const { data } = service.useGet(id, {})
      expect(data.value).toBe(null)
    })

    test.skip("can show previous record while a new one loads", async () => {
      // A hook to cause a delay so we can check pending state
      let hookRunCount = 0
      const hook = async () => {
        if (hookRunCount < 2) {
          hookRunCount++
          await timeout(50)
        }
      }
      service.hooks({ before: { get: [hook] } })

      const id = ref("1")
      const { data, request, isPending } = service.useGet(id)

      await request.value

      expect(isPending.value).toBe(false)
      expect(data.value?._id).toBe("1")

      id.value = "2"

      await timeout(20)

      expect(isPending.value).toBe(true)
      expect(data.value?._id).toBe("1")

      await request.value

      expect(isPending.value).toBe(false)
      expect(data.value?._id).toBe("2")
    })

    test.skip("can prevent a query with queryWhen", async () => {
      const id = ref("1")
      const { data, get, requestCount, queryWhen, request } = service.useGet(
        id,
        {
          immediate: false,
        }
      )
      const queryWhenFn = vi.fn(() => {
        return !data.value
      })
      queryWhen(queryWhenFn)
      expect(requestCount.value).toBe(0)

      await get()

      // queryWhen is called even when manually calling `get`
      expect(queryWhenFn).toHaveBeenCalled()
      expect(requestCount.value).toBe(1)

      id.value = "2"
      await timeout(20)
      await request.value

      expect(requestCount.value).toBe(2)

      id.value = "1"
      await timeout(20)
      await request.value

      expect(requestCount.value).toBe(2)
      expect(queryWhenFn).toHaveBeenCalledTimes(3)
    })

    test.skip("can disable watch", async () => {
      const id = ref("1")
      const { get, requestCount, request } = service.useGet(id, {
        watch: false,
      })
      expect(requestCount.value).toBe(0)

      await get()

      expect(requestCount.value).toBe(1)

      id.value = "2"
      await timeout(20)
      await request.value

      expect(requestCount.value).toBe(1)

      id.value = "1"
      await timeout(20)
      await request.value

      expect(requestCount.value).toBe(1)
    })
  })

  describe("Manual Get with Ref", () => {
    test("can update ref and manually get correct data", async () => {
      const id = ref("1")
      const { data, get } = service.useGet(id, { immediate: false })
      expect(data.value).toBeNull()

      await get()
      expect(data.value?._id).toBe("1")

      id.value = "2"
      expect(data.value).toBeNull()

      await get()
      expect(data.value?._id).toBe("2")
    })
  })

  describe("Can be configured to not fetch data", () => {
    test("no watch, no immediate", async () => {
      // assume we fetched data separately
      await service.find({ query: { $limit: 20 } })

      const id = ref("1")
      const { data, request, requestCount } = service.useGet(id, {
        watch: false,
        immediate: false,
      })
      await request.value
      expect(data.value?._id).toBe("1")
      expect(requestCount.value).toBe(0)
    })
  })

  describe("clones", () => {
    test("can return clones", async () => {
      const id = ref("1")
      const { data, request } = service.useGet(id, { clones: true })
      await request.value
      expect(data.value?._id).toBe("1")
      expect(data.value?.__isClone).toBe(true)
    })
  })

  describe("useGetOnce", () => {
    test("store.useGetOnce only queries once per id", async () => {
      const id = ref("1")
      const { data, get, requestCount, request } = service.useGetOnce(id)
      expect(requestCount.value).toBe(1)
      expect(data.value).toBe(null)

      // Wait for the internal request and for the data to fill the store.
      await request.value
      await timeout(20)
      await get()

      // queryWhen is called even when manually calling `get`
      expect(requestCount.value).toBe(1)

      id.value = "2"
      await timeout(20)
      await request.value

      expect(requestCount.value).toBe(2)

      id.value = "1"
      await timeout(20)
      await request.value

      expect(requestCount.value).toBe(2)
    })
  })

  describe("Errors", () => {
    test("sets and clears errors", async () => {
      // Throw an error in a hook
      let hasHookRun = false
      const hook = () => {
        if (!hasHookRun) {
          hasHookRun = true
          throw new Error("fail")
        }
      }
      service.hooks({ before: { get: [hook] } })

      const { error, clearError, get, request } = service.useGet("1", {
        immediate: false,
      })
      expect(error.value).toBe(null)

      await get()
      // wait extra time to make sure the request happened
      await timeout(10)
      await request.value

      expect(error.value.message).toBe("fail")

      clearError()

      expect(error.value).toBe(null)
    })

    test("swallows error and sets error ref if a service error is received", async () => {
      const { data, error, clearError, get, request } = service.useGet("A", {
        immediate: false,
      })

      await get()
      // wait extra time to make sure the request happened
      await timeout(10)
      await request.value

      expect(data.value).toBe(null)
      expect(error.value.message).toBe("No record found for id 'A'")

      clearError()

      expect(error.value).toBe(null)
    })
  })
})
