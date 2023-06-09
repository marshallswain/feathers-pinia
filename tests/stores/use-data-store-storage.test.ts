import { api, makeContactsData } from '../fixtures.js'
import { resetService } from '../test-utils.js'

const service = api.service('contacts')

beforeEach(async () => {
  resetService(service)
  service.service.store = makeContactsData()
  await service.find({ query: { $limit: 100 } })
})
afterEach(() => resetService(service))

describe('useModelInstance temps', () => {
  beforeEach(() => {
    service.store.clearAll()
  })

  test('assigns tempid when no id provided', async () => {
    const task = service.new({ name: 'test' })
    expect(task.__tempId).toBeDefined()
  })

  test('has no __tempId id is present', async () => {
    const task = service.new({ _id: '1', name: 'foo', age: 44 })
    expect(task.__tempId).toBeUndefined()
  })

  test('not added to Model store by default', () => {
    service.new({ description: 'foo', isComplete: true })
    expect(service.store.items.length).toBe(0)
    expect(service.store.temps.length).toBe(0)
    expect(service.store.clones.length).toBe(0)
  })

  test('call createInStore without id to add to tempStore', () => {
    const task = service
      .new({ description: 'foo', isComplete: true })
      .createInStore()
    expect(service.store.temps.length).toBe(1)
    expect(service.store.temps[0]).toBe(task)
  })

  test('call createInStore with id to add to itemStore', () => {
    const task = service
      .new({ _id: '1', description: 'foo', isComplete: true })
      .createInStore()
    expect(service.store.items.length).toBe(1)
    expect(service.store.items[0]).toBe(task)
  })

  test('call removeFromStore on temp', () => {
    const task = service
      .new({ description: 'foo', isComplete: true })
      .createInStore()
    task.removeFromStore()
    expect(service.store.temps.length).toBe(0)
  })

  test('call removeFromStore on item', () => {
    const task = service
      .new({ _id: '1', description: 'foo', isComplete: true })
      .createInStore()
    task.removeFromStore()
    expect(service.store.items.length).toBe(0)
  })
})
