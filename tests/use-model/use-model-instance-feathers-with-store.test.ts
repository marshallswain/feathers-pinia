import type { Tasks, TasksData, TasksQuery } from '../feathers-schema-tasks'
import { useBaseModel, useInstanceDefaults, type ModelInstance } from '../../src/use-base-model/index'
import { useService } from '../../src'
import { api } from '../feathers'
import { createPinia, defineStore } from 'pinia'
import { feathersPiniaHooks } from '../../src/hooks'

const pinia = createPinia()

const ModelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({ test: true, foo: 'bar' }, data)
  return withDefaults
}
const Task = useBaseModel<Tasks, TasksQuery, typeof ModelFn>({ name: 'Task', idField: '_id' }, ModelFn)
type TaskInstance = ReturnType<typeof Task>

// passing the ModelFn into `useService` overwrites the model's feathers methods to proxy through the store.
const useTaskStore = defineStore('counter', () => {
  const service = useService<TaskInstance, TasksData, TasksQuery, typeof Task>({
    service: api.service('messages'),
    idField: '_id',
    ModelFn: Task,
  })

  return { ...service }
})
const taskStore = useTaskStore(pinia)

api.service('tasks').hooks({
  around: {
    all: [...feathersPiniaHooks(Task, taskStore)],
  },
})

describe('useInstanceFeathers with store', () => {
  test('has methods', async () => {
    const task = taskStore.Model({})
    expect(typeof task.save).toBe('function')
    expect(typeof task.create).toBe('function')
    expect(typeof task.patch).toBe('function')
    expect(typeof task.remove).toBe('function')
  })

  test('instance.create', async () => {
    const task = taskStore.Model({ _id: '1' })
    const result = await task.create()
    expect(result._id).toBe('1')

    expect(taskStore.items.length).toBe(1)
  })

  test('instance.patch', async () => {
    const task = taskStore.Model({ _id: '1' })
    await task.create()
    task.description = 'do the dishes'
    const result = await task.patch()
    expect(result.description).toBe('do the dishes')
    expect(task.description).toBe('do the dishes')
  })

  test('instance.remove', async () => {
    const task = taskStore.Model({ _id: '1', description: 'test' })
    await task.save()

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
})
