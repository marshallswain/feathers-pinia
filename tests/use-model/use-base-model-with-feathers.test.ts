import type { Tasks, TasksData, TasksQuery } from '../feathers-schema-tasks'
import {
  useBaseModel,
  useInstanceDefaults,
  useFeathersInstance,
  type ModelInstance,
} from '../../src/use-base-model/index'
import { useService } from '../../src'
import { api } from '../feathers'
import { createPinia, defineStore } from 'pinia'
import { feathersPiniaHooks } from '../../src/hooks'
import { resetServiceStore, timeout, timeoutHook } from '../test-utils'

const pinia = createPinia()
const service = api.service('tasks')

const modelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({ description: '', isComplete: false }, data)
  const asFeathersInstance = useFeathersInstance({ service }, withDefaults)
  return asFeathersInstance
}
const Task = useBaseModel<Tasks, TasksQuery, typeof modelFn>({ name: 'Task', idField: '_id' }, modelFn)

// passing the Model into `useService` overwrites the model's feathers methods to proxy through the store.
const useTaskStore = defineStore('counter', () => {
  const serviceUtils = useService<Tasks, TasksData, TasksQuery, typeof Task>({
    service,
    idField: '_id',
    Model: Task,
  })

  return { ...serviceUtils }
})
const taskStore = useTaskStore(pinia)
Task.setStore(taskStore)

api.service('tasks').hooks({ around: { all: [...feathersPiniaHooks(Task)] } })

beforeEach(() => {
  resetServiceStore(service)
})

describe('useBaseModel with useInstanceFeathers', () => {
  test('no model methods', () => {
    const keys = Object.keys(Task)
    expect(keys.includes('find')).toBeFalsy()
    expect(keys.includes('count')).toBeFalsy()
    expect(keys.includes('get')).toBeFalsy()
    expect(keys.includes('create')).toBeFalsy()
    expect(keys.includes('update')).toBeFalsy()
    expect(keys.includes('patch')).toBeFalsy()
    expect(keys.includes('remove')).toBeFalsy()
  })

  test('instances have pending state', async () => {
    const task = taskStore.Model({})
    expect(task.isSavePending).toBeDefined()
    expect(task.isCreatePending).toBeDefined()
    expect(task.isPatchPending).toBeDefined()
    expect(task.isRemovePending).toBeDefined()
  })

  test('isSavePending with isCreatePending state properly updates', async () => {
    service.hooks({ before: { all: [timeoutHook(20)] } })
    const task = Task({})

    const request = task.save()
    await timeout(0)
    expect(task.isSavePending).toBeTruthy()
    expect(task.isCreatePending).toBeTruthy()

    await request
    expect(task.isSavePending).toBeFalsy()
    expect(task.isCreatePending).toBeFalsy()
  })

  test('isSavePending with isPatchPending state properly updates', async () => {
    service.hooks({ before: { all: [timeoutHook(20)] } })
    const task = await Task({}).save()
    task.description = 'foo'

    const request = task.save()
    await timeout(0)
    expect(task.isSavePending).toBeTruthy()
    expect(task.isPatchPending).toBeTruthy()

    await request
    expect(task.isSavePending).toBeFalsy()
    expect(task.isPatchPending).toBeFalsy()
  })

  test('isRemovePending properly updates', async () => {
    service.hooks({ before: { all: [timeoutHook(20)] } })
    const task = await Task({}).save()

    const request = task.remove()
    await timeout(0)
    expect(task.isRemovePending).toBeTruthy()

    await request
    expect(task.isRemovePending).toBeFalsy()
  })

  test('instances have methods', async () => {
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
    expect(task.description).toEqual('')
    expect(task.isComplete).toEqual(false)

    await task.create()

    task.description = 'do the dishes'

    const result = await task.patch()
    expect(task.description).toBe('do the dishes')
    expect(result.description).toBe('do the dishes')
  })

  test('instance.remove', async () => {
    const task = taskStore.Model({ description: 'test' })
    const saved = await task.save()

    expect(saved._id).toBe(0)
    expect(saved.description).toBe('test')

    const stored = await api.service('tasks').get(0)

    expect(stored.description).toBe('test')

    await task.remove()

    await expect(api.service('tasks').get(0)).rejects.toThrow("No record found for id '0'")
  })
})
