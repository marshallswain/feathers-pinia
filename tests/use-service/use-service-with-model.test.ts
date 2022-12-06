import type { Tasks, TasksData, TasksQuery } from '../feathers-schema-tasks'
import { useService } from '../../src'
import {
  useInstanceDefaults,
  useInstanceModel,
  type BaseModelData,
  useInstanceFeathers,
  useModelBase,
} from '../../src/use-base-model/index'
import { api } from '../feathers'
import { defineStore, createPinia } from 'pinia'
import { feathersPiniaHooks } from '../../src/hooks'
import { resetStores } from '../test-utils'

const Task = useModelBase((data: Partial<Tasks & BaseModelData>) => {
  const asModel = useInstanceModel(data, { name: 'Task', idField: '_id' })
  const withDefaults = useInstanceDefaults({ test: true, foo: 'bar' }, asModel)
  const withFeathers = useInstanceFeathers(withDefaults, api.service('tasks'))

  return withFeathers as typeof withFeathers
})
export type TaskInstance = ReturnType<typeof Task>

const task = Task({})
task.__Model.clone
// const task2 = task.__Model({}) as typeof task

export const useTaskStore = defineStore('counter', () => {
  const service = useService<TaskInstance, TasksData, TasksQuery>({
    service: api.service('tasks'),
    idField: '_id',
    ModelFn: Task,
  })

  return { ...service }
})
const pinia = createPinia()
const taskStore = useTaskStore(pinia)

api.service('tasks').hooks({
  around: {
    all: [...feathersPiniaHooks(Task, taskStore)],
  },
})

const reset = () => {
  resetStores(api.service('tasks'), taskStore)
}

describe('use-service', () => {
  beforeEach(async () => {
    reset()
    api.service('tasks').store = {
      1: { _id: '1', description: 'Moose' },
      2: { _id: '2', description: 'moose' },
      3: { _id: '3', description: 'Goose' },
      4: { _id: '4', description: 'Loose' },
    }
  })

  describe('find', () => {
    test('store.find adds to store and returns store instance', async () => {
      const response = await taskStore.find({ query: { description: 'Moose' } })
      const [task] = response.data
      expect(task.__modelName).toBe('Task')
      expect(taskStore.getFromStore('1')).toBe(task)
      expect(task._id).toBe('1')
    })

    test('feathers.find adds to store and returns store instance', async () => {
      const response = await api.service('tasks').find({ query: { description: 'Moose' } })
      const [task] = response.data
      expect(task.__modelName).toBe('Task')
      expect(taskStore.getFromStore('1')).toBe(task)
      expect(task._id).toBe('1')
    })
  })

  describe('get', () => {
    test('store.get adds to store and returns store instance', async () => {
      const task = await taskStore.get('1')
      expect(task.__modelName).toBe('Task')
      expect(taskStore.getFromStore('1')).toBe(task)
      expect(task._id).toBe('1')
    })

    test('feathers.get adds to store and returns store instance', async () => {
      const task = await api.service('tasks').get('1')
      expect(task.__modelName).toBe('Task')
      expect(taskStore.getFromStore('1')).toBe(task)
      expect(task._id).toBe('1')
    })

    test('store.get skip if exists', async () => {
      await taskStore.get('1')
      api.service('tasks').store[1] = { _id: '1', description: 'Moose changed' }

      const task2 = await taskStore.get('1', { skipRequestIfExists: true })
      expect(task2.__modelName).toBe('Task')
      expect(taskStore.getFromStore('1')).toBe(task2)
      expect(task2.description).toBe('Moose')
      expect(task2._id).toBe('1')

      await taskStore.get('1')
      expect(task2.description).toBe('Moose changed')
    })

    test('store.get skip if exists', async () => {
      await api.service('tasks').get('1')
      api.service('tasks').store[1] = { _id: '1', description: 'Moose changed' }

      const task2 = await api.service('tasks').get('1', { skipRequestIfExists: true })
      expect(task2.__modelName).toBe('Task')
      expect(taskStore.getFromStore('1')).toBe(task2)
      expect(task2.description).toBe('Moose')
      expect(task2._id).toBe('1')

      await api.service('tasks').get('1')
      expect(task2.description).toBe('Moose changed')
    })
  })

  test('store.patch updates the store', async () => {
    const stored = await taskStore.get('1')
    const task = await taskStore.patch('1', { description: 'Moose patched' })
    expect(task.__modelName).toBe('Task')
    expect(stored).toBe(task)
    expect(task.description).toBe('Moose patched')
  })

  test('store.remove removes item from store', async () => {
    await taskStore.get('1')
    const task = await taskStore.remove('1')
    expect(task.__modelName).toBe('Task')
    expect(taskStore.getFromStore('1')).toBe(null)
  })

  test('feathers.remove removes item from store', async () => {
    await taskStore.get('1')
    const task = await api.service('tasks').remove('1')
    expect(task.__modelName).toBe('Task')
    expect(taskStore.getFromStore('1')).toBe(null)
  })
})
