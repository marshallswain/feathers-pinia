import type { Tasks, TasksData, TasksQuery } from '../feathers-schema-tasks'
import { type ModelInstance, useFeathersModel, useInstanceDefaults, feathersPiniaHooks } from '../../src'
import { api } from '../feathers'

const service = api.service('tasks')

const ModelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({ description: '', isComplete: false }, data)
  return withDefaults
}
const Task = useFeathersModel<Tasks, TasksData, TasksQuery, typeof ModelFn>(
  { name: 'Task', idField: '_id', service },
  ModelFn,
)

service.hooks({ around: { all: [...feathersPiniaHooks(Task)] } })

describe('useFeathersModel', () => {
  test('Model.find returns feathers instances', async () => {
    await Task({ description: 'test' }).save()
    const result = await Task.find({ query: {} })
    const [task] = result.data
    expect(task.description).toBe('test')
    expect(typeof task.save).toBe('function')
    expect(typeof task.create).toBe('function')
    expect(typeof task.patch).toBe('function')
    expect(typeof task.remove).toBe('function')
    expect(typeof task.removeFromStore).toBe('function')
    expect(typeof task.addToStore).toBe('function')
  })

  test('Model.get returns feathers instance', async () => {
    const _task = await Task({ description: 'test' }).save()
    const task = await Task.get(_task._id as string)
    expect(typeof task.save).toBe('function')
    expect(typeof task.create).toBe('function')
    expect(typeof task.patch).toBe('function')
    expect(typeof task.remove).toBe('function')
    expect(typeof task.removeFromStore).toBe('function')
    expect(typeof task.addToStore).toBe('function')
  })

  test('Model.create returns feathers instance', async () => {
    const task = await Task.create({ description: 'test' })
    expect(task.description).toBe('test')
    expect(typeof task.save).toBe('function')
    expect(typeof task.create).toBe('function')
    expect(typeof task.patch).toBe('function')
    expect(typeof task.remove).toBe('function')
    expect(typeof task.removeFromStore).toBe('function')
    expect(typeof task.addToStore).toBe('function')
  })

  test('Model.update returns feathers instance', async () => {
    const _task = await Task.create({ description: 'test1' })
    _task.description = 'test'
    const task = await Task.update(_task._id, _task)
    expect(task.description).toBe('test')
    expect(typeof task.save).toBe('function')
    expect(typeof task.create).toBe('function')
    expect(typeof task.patch).toBe('function')
    expect(typeof task.remove).toBe('function')
    expect(typeof task.removeFromStore).toBe('function')
    expect(typeof task.addToStore).toBe('function')
  })

  test('Model.patch returns feathers instance', async () => {
    const _task = await Task.create({ description: 'test1' })
    _task.description = 'test'
    const task = await Task.patch(_task._id as string, _task)
    expect(task.description).toBe('test')
    expect(typeof task.save).toBe('function')
    expect(typeof task.create).toBe('function')
    expect(typeof task.patch).toBe('function')
    expect(typeof task.remove).toBe('function')
    expect(typeof task.removeFromStore).toBe('function')
    expect(typeof task.addToStore).toBe('function')
  })

  test('Model.remove returns feathers instance', async () => {
    const _task = await Task.create({ description: 'test' })
    const task = await Task.remove(_task._id as string)
    expect(task.description).toBe('test')
    expect(typeof task.save).toBe('function')
    expect(typeof task.create).toBe('function')
    expect(typeof task.patch).toBe('function')
    expect(typeof task.remove).toBe('function')
    expect(typeof task.removeFromStore).toBe('function')
    expect(typeof task.addToStore).toBe('function')
  })

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
