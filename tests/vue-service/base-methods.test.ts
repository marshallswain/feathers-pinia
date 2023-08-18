import { api } from '../fixtures/index.js'
import { resetService } from '../test-utils.js'

const service = api.service('users')

beforeEach(async () => {
  resetService(service)
})
afterEach(() => resetService(service))
describe('The general types work for typed Feathers clients', () => {
  test('has custom methods', async () => {
    // create data instances
    expect(service.new).toBeTruthy()

    // api methods
    expect(service.find).toBeTruthy()
    expect(service.findOne).toBeTruthy()
    expect(service.count).toBeTruthy()
    expect(service.get).toBeTruthy()
    expect(service.create).toBeTruthy()
    expect(service.patch).toBeTruthy()
    expect(service.remove).toBeTruthy()

    // store methods
    expect(service.findInStore).toBeTruthy()
    expect(service.findOneInStore).toBeTruthy()
    expect(service.countInStore).toBeTruthy()
    expect(service.getFromStore).toBeTruthy()
    expect(service.createInStore).toBeTruthy()
    expect(service.patchInStore).toBeTruthy()
    expect(service.removeFromStore).toBeTruthy()

    // hybrid methods
    expect(service.useFind).toBeTruthy()
    expect(service.useGet).toBeTruthy()
    expect(service.useGetOnce).toBeTruthy()

    // event methods
    expect(service.on).toBeTruthy()
    expect(service.emit).toBeTruthy()
    expect(service.removeListener).toBeTruthy()
  })
})
