import { api, makeContactsData } from '../fixtures/index.js'
import { resetService } from '../test-utils.js'

const service = api.service('contacts')

beforeEach(async () => {
  resetService(service)
  service.service.store = makeContactsData()
  await service.find({ query: { $limit: 100 } })
})
afterEach(() => resetService(service))

describe('Customizing the Store', () => {
  it('has global state', async () => {
    expect(api.service('users').store.globalCustom).toBe(true)
  })

  it('can override global state', async () => {
    expect(api.service('contacts').store.globalCustom).toBe(false)
  })

  it('can have service state', async () => {
    expect(service.store.serviceCustom).toBe(false)
  })

  it('can have getters', async () => {
    expect(service.store.serviceCustomOpposite).toBe(true)
  })

  it('can read from default store state', async () => {
    expect(service.store.itemsLength).toBe(12)
  })

  it('can have actions', async () => {
    expect(service.store.serviceCustom).toBe(false)
    service.store.setServiceCustom(true)
    expect(service.store.serviceCustom).toBe(true)
  })

  it('does not share top-level global state between services', async () => {
    expect(service.store.sharedGlobal).toBe(false)
    service.store.toggleSharedGlobal()
    expect(service.store.sharedGlobal).toBe(true)
    // other stores still have the original value because state is not shared.
    expect(api.service('users').store.sharedGlobal).toBe(false)
  })
})
