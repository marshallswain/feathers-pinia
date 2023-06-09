import { api, makeContactsData } from "../fixtures/index.js"
import { resetService } from "../test-utils.js"

const service = api.service("contacts")

beforeEach(async () => {
  resetService(service)
  service.service.store = makeContactsData()
  await service.find({ query: { $limit: 100 } })
})
afterEach(() => resetService(service))
describe("PiniaService", () => {
  test("includes model methods", () => {
    // create an instance
    expect(typeof service.new).toBe("function")

    // api methods
    expect(typeof service.find).toBe("function")
    expect(typeof service.findOne).toBe("function")
    expect(typeof service.count).toBe("function")
    expect(typeof service.get).toBe("function")
    expect(typeof service.create).toBe("function")
    expect(typeof service.patch).toBe("function")
    expect(typeof service.remove).toBe("function")

    // local query methods
    expect(typeof service.findInStore).toBe("function")
    expect(typeof service.findOneInStore).toBe("function")
    expect(typeof service.countInStore).toBe("function")
    expect(typeof service.getFromStore).toBe("function")
    expect(typeof service.createInStore).toBe("function")
    expect(typeof service.patchInStore).toBe("function")
    expect(typeof service.removeFromStore).toBe("function")

    // hybrid methods
    expect(typeof service.useFind).toBe("function")
    expect(typeof service.useGet).toBe("function")
    expect(typeof service.useGetOnce).toBe("function")

    expect(service.store).toBeDefined()
    expect(service.servicePath).toBe("contacts")
  })

  test("count", async () => {
    const response = await service.count()
    expect(response.data.length).toBe(0)
    expect(response.total).toBe(12)
    expect(response.limit).toBe(0)
    expect(response.skip).toBe(0)
  })

  test("count custom query", async () => {
    const response = await service.count({ query: { age: { $lt: 6 } } })
    expect(response.data.length).toBe(0)
    expect(response.total).toBe(3)
    expect(response.limit).toBe(0)
    expect(response.skip).toBe(0)
  })

  test("count cannot override limit", async () => {
    const response = await service.count({ query: { $limit: 5 } })
    expect(response.data.length).toBe(0)
    expect(response.total).toBe(12)
    expect(response.limit).toBe(0)
    expect(response.skip).toBe(0)
  })
})
