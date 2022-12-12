import type { Tasks, TasksData, TasksQuery } from '../feathers-schema-tasks'
import { useFeathersModel, useInstanceDefaults, type ModelInstance } from '../../src/use-base-model/index'
import { api } from '../feathers'
import { createPinia, defineStore } from 'pinia'
import { useService } from '../../src'
import { feathersPiniaHooks } from '../../src/hooks'

const pinia = createPinia()
const service = api.service('tasks')

const ModelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({ test: true, foo: 'bar', description: 'default' }, data)
  return withDefaults
}
const Task = useFeathersModel<Tasks, TasksData, TasksQuery, typeof ModelFn>(
  { name: 'Task', idField: '_id', service },
  ModelFn,
)
type TaskInstance = ReturnType<typeof Task>

// passing the ModelFn into `useService` overwrites the model's feathers methods to proxy through the store.
const useTaskStore = defineStore('tasks', () => {
  const serviceUtils = useService<TaskInstance, TasksData, TasksQuery, typeof Task>({
    service,
    idField: '_id',
    ModelFn: Task,
  })

  return { ...serviceUtils }
})
const taskStore = useTaskStore(pinia)
Task.setStore(taskStore)

api.service('tasks').hooks({
  around: {
    all: [...feathersPiniaHooks(Task, taskStore)],
  },
})

describe('useFeathersModel', () => {
  test('has new feathers-related methods', async () => {
    const task = Task({})
    expect(typeof task.save).toBe('function')
    expect(typeof task.create).toBe('function')
    expect(typeof task.patch).toBe('function')
    expect(typeof task.remove).toBe('function')
  })

  test('instance.create', async () => {
    const task = Task({ _id: '1' })
    const result = await task.create()
    expect(result._id).toBe('1')
  })

  test('instance.patch', async () => {
    const task = Task({ _id: '1' })
    await task.create()
    task.description = 'do the dishes'
    const result = await task.patch()
    expect(result.description).toBe('do the dishes')
    expect(task.description).toBe('do the dishes')
  })

  test('instance.remove', async () => {
    const task = Task({ _id: '1', description: 'test' })
    await task.create()

    const stored = await api.service('tasks').get('1')
    expect(stored.description).toBe('test')

    await task.remove()
    try {
      await api.service('tasks').get('1')
    } catch (error) {
      expect(error.message).toBe("No record found for id '1'")
    }
    expect.assertions(2)
  })

  test('Model.find', async () => {
    expect(typeof Task.find).toBe('function')
  })

  test('Model.count', async () => {
    expect(typeof Task.count).toBe('function')
  })

  test('Model.get', async () => {
    expect(typeof Task.get).toBe('function')
  })

  test('Model.create', async () => {
    expect(typeof Task.create).toBe('function')
  })

  test('Model.update', async () => {
    expect(typeof Task.update).toBe('function')
  })

  test('Model.patch', async () => {
    expect(typeof Task.patch).toBe('function')
  })

  test('Model.remove', async () => {
    expect(typeof Task.remove).toBe('function')
  })

  test('Model.findInStore', async () => {
    expect(typeof Task.findInStore).toBe('function')
  })

  test('Model.countInStore', async () => {
    expect(typeof Task.countInStore).toBe('function')
  })

  test('Model.getFromStore', async () => {
    expect(typeof Task.getFromStore).toBe('function')
  })

  test('Model.useFind', async () => {
    expect(typeof Task.useFind).toBe('function')
  })

  test('Model.useGet', async () => {
    expect(typeof Task.useGet).toBe('function')
  })

  test('Model.useGetOnce', async () => {
    expect(typeof Task.useGetOnce).toBe('function')
  })

  test('Model.useFindWatched', async () => {
    expect(typeof Task.useFindWatched).toBe('function')
  })

  test('Model.useGetWatched', async () => {
    expect(typeof Task.useGetWatched).toBe('function')
  })
})
