import { api, makeContactsData } from "../fixtures/index.js"
import { resetService } from "../test-utils.js"

const service = api.service("contacts")

beforeEach(async () => {
  resetService(service)
  service.service.store = makeContactsData()
})
afterEach(() => resetService(service))

describe("useModelInstance clones", () => {
  test("clone an item", async () => {
    const contact = service.new({ _id: "1", name: "Evan" })
    const cloned = contact.clone()
    expect(cloned._id).toBe("1")
    expect(cloned.__isClone).toBe(true)
    expect(cloned.name).toBe("Evan")
  })

  test("clone a temp keeps the tempId", async () => {
    const contact = service.new({ name: "Evan" })
    expect(contact.__tempId).toBeDefined()
    expect(typeof contact.clone).toBe("function")
    const cloned = contact.clone()
    expect(cloned.__tempId).toBe(contact.__tempId)
    expect(cloned.__isClone).toBe(true)
    expect(cloned.name).toBe("Evan")
  })

  test("clone a non-stored temp adds it to temps with __isClone set to false", () => {
    const contact = service.new({ name: "Evan" })
    contact.clone()
    const storedTemp = service.store.tempsById[contact.__tempId as string]
    expect(storedTemp).toBe(contact)
    expect(storedTemp.__isClone).toBe(false)
  })

  test("clone values are independent, do not leak into original item", async () => {
    const contact = service.new({ name: "Evan" })

    const cloned = contact.clone()
    cloned.name = "George"
    expect(contact.name).toBe("Evan")
  })

  test("modified clone properties commit to the original item", async () => {
    const contact = service.new({ name: "Evan" })

    const cloned = contact.clone()
    cloned.name = "George"

    const committed = cloned.commit()
    expect(committed.name).toEqual("George")
  })

  test("committing a temp keeps the tempId", async () => {
    const contact = service.new({ name: "Evan" })
    const cloned = contact.clone()
    const committed = cloned.commit()
    expect(committed.__isClone).toBe(false)
    expect(committed).toEqual(contact)
  })

  test("can re-clone after commit", async () => {
    const contact = service.new({ name: "Evan" })
    const cloned = contact.clone()
    const committed = cloned.commit()
    const recloned = committed.clone()
    expect(cloned).toBe(recloned)
  })

  test("calling reset on an original item clones the item", async () => {
    const contact = service.new({ name: "Evan" })
    const resetted = contact.reset()

    const storedClone = service.store.clonesById[contact.__tempId]
    expect(storedClone).toBe(resetted)
  })

  test("calling reset on a clone resets the clone", async () => {
    const contact = service.new({ name: "Evan" })
    const clone = contact.clone()
    clone.name = "George"

    const resetted = clone.reset()
    expect(clone).toBe(resetted)
    expect(resetted.name).toBe("Evan")
  })

  test("saving a clone", async () => {
    const contact = service.new({ name: "test" })
    const clone = contact.clone()
    const result = await clone.save()
    expect(result).toBe(clone)
    expect(result).not.toBe(contact)

    const original = service.getFromStore(result._id).value
    expect(result).not.toBe(original)
  })
})
