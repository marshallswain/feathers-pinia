import { api, makeContactsData } from '../fixtures/index.js'
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

  it('assigns tempid when no id provided', async () => {
    const task = service.new({ name: 'test' })
    expect(task.__tempId).toBeDefined()
  })

  it('has no __tempId id is present', async () => {
    const task = service.new({ _id: '1', name: 'foo', age: 44 })
    expect(task.__tempId).toBeUndefined()
  })

  it('not added to Model store by default', () => {
    service.new({ description: 'foo', isComplete: true } as any)
    expect(service.store.items.length).toBe(0)
    expect(service.store.temps.length).toBe(0)
    expect(service.store.clones.length).toBe(0)
  })

  it('call createInStore without id to add to tempStore', () => {
    const task = service.new({ description: 'foo', isComplete: true } as any).createInStore()
    expect(service.store.temps.length).toBe(1)
    expect(service.store.temps[0]).toBe(task)
  })

  it('call createInStore with id to add to itemStore', () => {
    const task = service.new({ _id: '1', description: 'foo', isComplete: true } as any).createInStore()
    expect(service.store.items.length).toBe(1)
    expect(service.store.items[0]).toBe(task)
  })

  it('call removeFromStore on temp', () => {
    const task = service.new({ description: 'foo', isComplete: true } as any).createInStore()
    task.removeFromStore()
    expect(service.store.temps.length).toBe(0)
  })

  it('call removeFromStore on item', () => {
    const task = service.new({ _id: '1', description: 'foo', isComplete: true } as any).createInStore()
    task.removeFromStore()
    expect(service.store.items.length).toBe(0)
  })
})
