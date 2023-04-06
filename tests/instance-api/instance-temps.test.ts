import { api, makeContactsData } from '../fixtures'
import { resetService } from '../test-utils'

const service = api.service('contacts')

beforeEach(async () => {
  resetService(service)
  service.service.store = makeContactsData()
  await service.find({ query: { $limit: 100 } })
})
afterEach(() => resetService(service))

describe(`Temporary Records`, () => {
  test('store can hold temps', () => {
    expect(service.store).toHaveProperty('tempsById')
    expect(service.store).toHaveProperty('temps')
    expect(service.store).toHaveProperty('tempIds')
  })

  test('records without idField get tempIdField added', () => {
    const item = service.new({ name: 'this is a test' })
    expect(typeof item.__tempId).toBe('string')
    expect(item.__isTemp).toBeTruthy()
  })

  test('records with idField do not get tempIdField added', () => {
    const item = service.new({ _id: '2', name: 'this is a test' })
    expect(item.__tempId).toBeUndefined()
    expect(item.__isTemp).toBeFalsy()
  })

  test('temps can be retrieved with getFromStore', () => {
    const item = service.new({ name: 'this is a test' }).createInStore()
    const tempFromStore = service.getFromStore(item.__tempId).value
    expect(tempFromStore?.__tempId).toBe(item.__tempId)
    expect(tempFromStore?.__isTemp).toBeTruthy()
  })

  test('temps are added to tempsById', () => {
    const item = service.new({ name: 'this is a test' }).createInStore()
    expect(service.store.tempsById).toHaveProperty(item.__tempId)
  })

  test('saving a temp does not remove __tempId, standalone temp not updated', async () => {
    const temp = service.new({ name: 'this is a test' })
    expect(temp._id).toBeUndefined()
    expect(temp.__tempId).toBeDefined()

    const item = await temp.save()
    expect(temp._id).toBeDefined()
    expect(temp.__tempId).toBeDefined()
    expect(item._id).toBeDefined()
    expect(item.__tempId).toBeDefined()
  })

  test('saving a temp does not remove __tempId, temp added to store is updated', async () => {
    const temp = service.new({ name: 'this is a test' }).createInStore()
    const item = await temp.save()
    expect(temp._id).toBeDefined()
    expect(temp.__tempId).toBeDefined()
    expect(item._id).toBeDefined()
    expect(item.__tempId).toBeDefined()
  })

  test('saving a temp removes it from tempsById', async () => {
    const item = service.new({ name: 'this is a test' })
    await item.save()
    expect(item.__tempId).toBeDefined()
    expect(service.store.tempsById).not.toHaveProperty(item.__tempId)
  })

  test('find getter does not returns temps when params.temps is falsy', async () => {
    service.new({ name: 'this is a test' }).createInStore()
    const { data } = service.findInStore({ query: {} })
    expect(data.value.length).toBe(12)
  })

  test('find getter returns temps when temps param is true', async () => {
    service.new({ name: 'this is a test' }).createInStore()
    const { data } = service.findInStore({ query: {}, temps: true })
    expect(data.value.length).toBe(13)
  })

  test('temps can be removed from the store', async () => {
    const item = service.new({ name: 'this is a test' }).createInStore()
    item.removeFromStore()
    expect(item.__tempId).toBeDefined()
    expect(service.store.tempsById).not.toHaveProperty(item.__tempId)
  })
})
