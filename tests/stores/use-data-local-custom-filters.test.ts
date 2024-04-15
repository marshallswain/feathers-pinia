import { api, makeContactsData } from '../fixtures/index.js'
import { resetService } from '../test-utils.js'

const service = api.service('contacts')

describe('Custom Filters for findInStore', () => {
  beforeEach(async () => {
    resetService(service)
    service.service.store = makeContactsData()
    await service.find({ query: { $limit: 100 } })
  })
  afterEach(() => resetService(service))

  test('can filter objects with $fuzzy', async () => {
    const { data } = service.findInStore({
      query: {
        $fuzzy: {
          search: 'gose',
          fields: ['name'],
        }
      }
    })
    expect(data[0].name).toEqual('Goose')
  })

  test('$fuzzy can filter multiple fields', async () => {
    const { data } = service.findInStore({
      query: {
        $fuzzy: {
          search: '25',
          fields: ['name', 'age'],
        }
      }
    })
    expect(data[0].name).toEqual('Batman')
  })
})
