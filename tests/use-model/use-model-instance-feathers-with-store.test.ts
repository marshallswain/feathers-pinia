import type { Tasks, TasksData, TasksQuery } from '../feathers-schema-tasks'
import { useService } from '../../src'
import {
  useInstanceDefaults,
  useInstanceModel,
  BaseModelData,
  useInstanceFeathers,
  makeModelInstances,
} from '../../src/use-base-model/index'
import { api } from '../feathers'
import { createPinia, defineStore } from 'pinia'
import { setPending, syncStore } from '../../src/use-service'

const pinia = createPinia()

// calling `useInstanceFeathers` in the ModelFn sets up the types
const Task = (data: Partial<Tasks & BaseModelData>) => {
  const asModel = useInstanceModel(data, { name: 'Task', idField: '_id' })
  const withDefaults = useInstanceDefaults({ test: true, foo: 'bar' }, asModel)
  const withFeathers = useInstanceFeathers(withDefaults, api.service('tasks'))

  return withFeathers
}
type TaskInstance = ReturnType<typeof Task>

// passing the ModelFn into `useService` overwrites the model's feathers methods to proxy through the store.
const useTaskStore = defineStore('counter', () => {
  const service = useService<TaskInstance, TasksData, TasksQuery>({
    service: api.service('messages'),
    idField: '_id',
    ModelFn: Task,
  })

  return { ...service }
})
const taskStore = useTaskStore(pinia)

// MARSHALL:
// - Test these new hooks: `makeModelInstances` and`syncStore` in hooks
// - Remove `addToStore` calls in

api.service('tasks').hooks({
  around: {
    all: [setPending(taskStore)],
  },
  after: {
    all: [makeModelInstances(Task), syncStore(taskStore)],
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
})
