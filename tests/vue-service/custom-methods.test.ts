import { api } from '../fixtures'
import { resetService } from '../test-utils'

const service = api.service('users')

beforeEach(async () => {
  resetService(service)
})
afterEach(() => resetService(service))
describe('Custom Service Methods', () => {
  test('has custom methods', async () => {
    expect(typeof service.customCreate).toBe('function')
    const result = await service.customCreate({
      email: 'test@test.com',
      password: 'test',
    })
    expect(result.custom).toBeTruthy()
  })
})
