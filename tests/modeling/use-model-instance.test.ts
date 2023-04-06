import { useDataStore } from '../../src'
import { createPinia, defineStore } from 'pinia'

const pinia = createPinia()

const useStore = defineStore('custom-tasks', () => {
  const utils = useDataStore({
    idField: 'id',
  })
  return { ...utils }
})
const store = useStore(pinia)

const data = { id: 1, description: 'Build FeathersJS', isComplete: true }

describe('standalone stores', () => {
  beforeEach(() => {
    store.clearAll()
  })

  it('can create instances with store.new', async () => {
    const task = store.new(data)
    expect(task.__isBaseInstance).toBe(true)
    expect(task.__isClone).toBe(false)
    expect(task.__idField).toBe('id')
    expect(task.__tempId).toBe(undefined)
    expect(task.__isTemp).toBe(false)
    expect(typeof task.hasClone).toBe('function')
    expect(typeof task.clone).toBe('function')
    expect(typeof task.commit).toBe('function')
    expect(typeof task.reset).toBe('function')
    expect(typeof task.createInStore).toBe('function')
    expect(typeof task.removeFromStore).toBe('function')
  })

  it('instances without id get a tempId', async () => {
    const task = store.new({ description: 'foo' })
    expect(task.id).toBeUndefined()
    expect(typeof task.__tempId).toBe('string')
    expect(task.__isTemp).toBe(true)
  })

  test('instances are not automatically added to the store when calling new', async () => {
    const task = store.new(data)
    expect(task).toBeDefined()
    const stored = store.getFromStore(1)
    expect(stored.value).toBeNull()
  })

  test('can add instances to the store', async () => {
    const task = store.new(data)
    task.createInStore()
    const stored = store.getFromStore(1)
    expect(stored.value?.id).toBe(1)
  })

  test('instances intact after clone', async () => {
    const task = store.new(data)
    const clone = task.clone()
    expect(clone.id).toBe(1)
    expect(clone.__isClone).toBe(true)
  })

  test('instances intact after commit', async () => {
    const task = store.new(data)
    const clone = task.clone()
    clone.description = 'foo'
    const committed = clone.commit()
    expect(committed.id).toBe(1)
    expect(committed.description).toBe('foo')
    expect(committed.__isClone).toBe(false)
  })

  test('instances intact after removeFromStore', async () => {
    const task = store.new(data)
    task.createInStore()

    const clone = task.clone()
    clone.description = 'foo'
  })

  // test('instances are still instances after findInStore', async () => {
  //   Task({ _id: '1', description: 'test' }).createInStore()
  //   const [task] = Task.findInStore({ query: {} }).data
  //   expect(task.__Model).toBeDefined()
  //   expect(task.__idField).toBeDefined()
  //   expect(task.__isClone).toBeDefined()
  //   expect(task.__isTemp).toBeDefined()
  //   expect(task.__modelName).toBeDefined()
  //   expect(task.createInStore).toBeDefined()
  //   expect(task.clone).toBeDefined()
  //   expect(task.commit).toBeDefined()
  //   expect(task.reset).toBeDefined()
  //   expect(task.removeFromStore).toBeDefined()
  // })

  // test('instances are still instances after findInStore', async () => {
  //   Task({ _id: '1', description: 'test' }).createInStore()
  //   const task = Task.getFromStore('1')
  //   expect(task?.__Model).toBeDefined()
  //   expect(task?.__idField).toBeDefined()
  //   expect(task?.__isClone).toBeDefined()
  //   expect(task?.__isTemp).toBeDefined()
  //   expect(task?.__modelName).toBeDefined()
  //   expect(task?.createInStore).toBeDefined()
  //   expect(task?.clone).toBeDefined()
  //   expect(task?.commit).toBeDefined()
  //   expect(task?.reset).toBeDefined()
  //   expect(task?.removeFromStore).toBeDefined()
  // })
})
