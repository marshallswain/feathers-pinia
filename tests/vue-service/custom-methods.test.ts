import { api } from '../fixtures/index.js'
import { resetService } from '../test-utils.js'

const service = api.service('users')

beforeEach(async () => {
  resetService(service)
})
afterEach(() => resetService(service))
describe('Custom Service Methods', () => {
  it('has custom methods', async () => {
    expect(typeof service.customCreate).toBe('function')
    const result = await service.customCreate({
      email: 'test@test.com',
      password: 'test',
    })
    expect(result.custom).toBeTruthy()
  })
})
