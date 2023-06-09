import { api, makeContactsData } from "../fixtures/index.js"
import { resetService } from "../test-utils.js"

const service = api.service("contacts")

beforeEach(async () => {
  resetService(service)
  service.service.store = makeContactsData()
  await service.find({ query: { $limit: 100 } })
})
afterEach(() => resetService(service))

describe("useInstanceDefaults", () => {
  test("has defaults", async () => {
    const contact = service.new({})
    expect(contact.name).toBe("")
    expect(contact.age).toBe(0)
  })

  test("overwrite defaults with data", async () => {
    const contact = service.new({ name: "foo", age: 55 })
    expect(contact.name).toBe("foo")
    expect(contact.age).toBe(55)
  })
})
