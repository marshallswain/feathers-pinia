import { api, makeContactsData } from '../fixtures.js'
import { resetService, timeout } from '../test-utils.js'
import { vi } from 'vitest'

const service = api.service('contacts')

beforeEach(async () => {
  resetService(service)
  service.service.store = makeContactsData()
  await service.find({ query: { $limit: 100 } })
})
afterEach(() => resetService(service))

describe('useDataStore events', () => {
  it('handles created events', async () => {
    api
      .service('contacts')
      .emit('created', { _id: 'foo', name: 'Steve', age: 99 })
    await timeout(50)
    const item = api.service('contacts').getFromStore('foo')
    expect(item.value.name).toBe('Steve')
  })

  it('handles updated events', async () => {
    api
      .service('contacts')
      .emit('updated', { _id: 'foo', name: 'Steve', age: 99 })
    await timeout(50)
    const item = api.service('contacts').getFromStore('foo')
    expect(item.value.name).toBe('Steve')
  })

  it('handles patched events', async () => {
    api
      .service('contacts')
      .emit('patched', { _id: 'foo', name: 'Steve', age: 99 })
    await timeout(50)
    const item = api.service('contacts').getFromStore('foo')
    expect(item.value.name).toBe('Steve')
  })

  it('handles removed events', async () => {
    const data = { _id: 'foo', name: 'Steve', age: 99 }
    api.service('contacts').store.createInStore(data)
    const added = api.service('contacts').getFromStore('foo')
    expect(added.value.name).toBe('Steve')

    api.service('contacts').emit('removed', data)
    await timeout(50)
    const item = api.service('contacts').getFromStore('foo')
    expect(item.value).toBeNull()
  })

  it('only handles events once', async () => {
    const data = { _id: 'foo', name: 'Steve', age: 99 }
    const eventHandler = vi.fn()
    api.service('contacts').on('created', eventHandler)
    api.service('contacts').emit('created', data)

    await timeout(50)
    expect(eventHandler).toHaveBeenCalledTimes(1)
  })
})
