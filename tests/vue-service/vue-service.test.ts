import { api } from '../fixtures'
import { resetService, timeout, timeoutHook } from '../test-utils'

const service = api.service('contacts')

beforeEach(() => {
  resetService(service)
})

describe('VueService', () => {
  test('includes model methods', () => {
    // create an instance
    expect(typeof service.new).toBe('function')

    // api methods
    expect(typeof service.find).toBe('function')
    expect(typeof service.findOne).toBe('function')
    expect(typeof service.count).toBe('function')
    expect(typeof service.get).toBe('function')
    expect(typeof service.create).toBe('function')
    expect(typeof service.patch).toBe('function')
    expect(typeof service.remove).toBe('function')

    // local query methods
    expect(typeof service.findInStore).toBe('function')
    expect(typeof service.findOneInStore).toBe('function')
    expect(typeof service.countInStore).toBe('function')
    expect(typeof service.getFromStore).toBe('function')
    expect(typeof service.createInStore).toBe('function')
    expect(typeof service.patchInStore).toBe('function')
    expect(typeof service.removeFromStore).toBe('function')

    // hybrid methods
    expect(typeof service.useFind).toBe('function')
    expect(typeof service.useGet).toBe('function')
    expect(typeof service.useGetOnce).toBe('function')

    expect(service.store).toBeDefined()
    expect(service.servicePath).toBe('contacts')
  })
})
