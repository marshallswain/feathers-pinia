import { api } from '../fixtures'
import { resetService } from '../test-utils'

const service = api.service('users')

beforeEach(async () => {
  resetService(service)
})
afterEach(() => resetService(service))
describe('Custom Service Methods', () => {
  test('has custom methods', () => {
    expect(typeof service.customCreate).toBe('function')
  })
})
