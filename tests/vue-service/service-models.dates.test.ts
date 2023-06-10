import { api, makeContactsData } from '../fixtures/index.js'
import { resetService } from '../test-utils.js'

const service = api.service('contacts')

beforeEach(async () => {
  resetService(service)
  service.service.store = makeContactsData()
  await service.find({ query: { $limit: 100 } })
})
afterEach(() => resetService(service))

describe('Working with Dates', () => {
  it('findInStore with Date Strings', async () => {
    const query = {
      birthdate: {
        $gt: '1979-03-1T07:00:00.000Z',
        $lt: '2018-03-1T07:00:00.000Z',
      },
    }
    const results = service.findInStore({ query })
    expect(results.data.value.length).toBe(5)
  })

  it('findInStore with Date objects returns no results against string data', async () => {
    const query = {
      birthdate: {
        $gt: new Date('1979-03-1T07:00:00.000Z'),
        $lt: new Date('2018-03-1T07:00:00.000Z'),
      },
    }
    const results = service.findInStore({ query })
    expect(results.data.value.length).toBe(0)
  })
})
