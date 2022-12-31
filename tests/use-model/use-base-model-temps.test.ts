import type { Tasks, TasksData, TasksQuery } from '../feathers-schema-tasks'
import { type ModelInstance, useInstanceDefaults, useFeathersModel, feathersPiniaHooks } from '../../src'
import { api } from '../feathers'

const service = api.service('tasks')

const modelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({ description: '', isComplete: false }, data)
  return withDefaults
}
const Task = useFeathersModel<Tasks, TasksData, TasksQuery, typeof modelFn>(
  { name: 'Task', idField: '_id', service },
  modelFn,
)

api.service('tasks').hooks({
  around: {
    all: [...feathersPiniaHooks(Task)],
  },
})

const reset = () => Task.store.clearAll()

describe(`Temporary Records`, () => {
  beforeEach(() => reset())
  afterEach(() => reset())

  test('store can hold temps', () => {
    expect(Task.store).toHaveProperty('tempsById')
    expect(Task.store).toHaveProperty('temps')
    expect(Task.store).toHaveProperty('tempIds')
  })

  test('records without idField get tempIdField added', () => {
    const item = Task({ description: 'this is a test' })
    expect(typeof item.__tempId).toBe('string')
    expect(item.__isTemp).toBeTruthy()
  })

  test('records with idField do not get tempIdField added', () => {
    const item = Task({ _id: '2', description: 'this is a test' })
    expect(item.__tempId).toBeUndefined()
    expect(item.__isTemp).toBeFalsy()
  })

  test('temps can be retrieved with getFromStore', () => {
    const item = Task({ description: 'this is a test' }).addToStore()
    const tempFromStore = Task.getFromStore(item.__tempId)
    expect(tempFromStore?.__tempId).toBe(item.__tempId)
    expect(tempFromStore?.__isTemp).toBeTruthy()
  })

  test('temps are added to tempsById', () => {
    const item = Task({ description: 'this is a test' }).addToStore()
    expect(Task.store.tempsById).toHaveProperty(item.__tempId)
  })

  test('saving a temp does not remove __tempId, standalone temp not updated', async () => {
    const temp = Task({ description: 'this is a test' })
    expect(temp._id).toBeUndefined()
    expect(temp.__tempId).toBeDefined()

    const item = await temp.save()
    expect(temp._id).toBeDefined()
    expect(temp.__tempId).toBeDefined()
    expect(item._id).toBeDefined()
    expect(item.__tempId).toBeDefined()
  })

  test('saving a temp does not remove __tempId, temp added to store is updated', async () => {
    const temp = Task({ description: 'this is a test' }).addToStore()
    const item = await temp.save()
    expect(temp._id).toBeDefined()
    expect(temp.__tempId).toBeDefined()
    expect(item._id).toBeDefined()
    expect(item.__tempId).toBeDefined()
  })

  test('saving a temp removes it from tempsById', async () => {
    const item = Task({ description: 'this is a test' })
    await item.save()
    expect(item.__tempId).toBeDefined()
    expect(Task.store.tempsById).not.toHaveProperty(item.__tempId)
  })

  test('find getter does not returns temps when params.temps is falsy', async () => {
    Task({ description: 'this is a test' }).addToStore()
    const data = Task.findInStore({ query: {} }).data
    expect(data.length).toBe(0)
  })

  test('find getter returns temps when temps param is true', async () => {
    Task({ description: 'this is a test' }).addToStore()
    const data = Task.findInStore({ query: {}, temps: true }).data
    expect(data.length).toBe(1)
  })

  test('temps can be removed from the store', async () => {
    const item = Task({ description: 'this is a test' }).addToStore()
    item.removeFromStore()
    expect(item.__tempId).toBeDefined()
    expect(Task.store.tempsById).not.toHaveProperty(item.__tempId)
  })
})
